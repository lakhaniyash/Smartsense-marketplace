import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, UserStatus } from '@prisma/client'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { AuditLogEntryOutput } from '../../common/graphql/audit-log-entry.output'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { CreateRoleInput } from './dto/create-role.input'
import { RoleOutput } from './dto/role.output'
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input'
import { UserConnectionOutput, UserEdgeOutput } from './dto/user-connection.output'
import { UserFilterInput } from './dto/user-filter.input'
import { UserSortField } from './dto/user-sort.enum'
import { UserSortInput } from './dto/user-sort.input'
import { UserOutput } from './dto/user.output'
import { UserReactivatedEvent } from './events/user-reactivated.event'
import { UserSuspendedEvent } from './events/user-suspended.event'

const DEFAULT_PAGE_SIZE = 20

const USER_INCLUDE = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>
type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { rolePermissions: { include: { permission: true } } }
}>

export interface FindUsersArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: UserFilterInput | undefined
  sort?: UserSortInput | undefined
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getStatus(): string {
    return 'users module initialized'
  }

  /**
   * No ownership scoping — `users:read` is Admin-only in the seeded catalog
   * (docs/authorization.md § Users row: Admin All, Partner/Customer —), so
   * unlike Orders/Customers this is a genuinely unrestricted, global-resource
   * list; nothing here needs a `user.partnerId`/`user.customerId` branch.
   */
  async findUsers(_user: AuthenticatedUser, args: FindUsersArgs): Promise<UserConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildWhere(args.filter)
    const orderBy = this.buildOrderBy(args.sort)

    const rows = await this.prisma.user.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: this.decodeCursor(after) },
        skip: 1,
      }),
      include: USER_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: UserEdgeOutput[] = page.map((row) => ({
      cursor: this.encodeCursor(row.id),
      node: this.mapUserToOutput(row),
    }))

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: after !== undefined,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    }
  }

  async findUserById(_user: AuthenticatedUser, id: string): Promise<UserOutput> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_INCLUDE,
    })
    if (row === null) {
      throw new NotFoundException('User not found')
    }
    return this.mapUserToOutput(row)
  }

  /** Backs the User detail page's Activity Timeline tab (same pattern as CustomersService.getAuditLog). */
  async getAuditLog(_user: AuthenticatedUser, userId: string): Promise<AuditLogEntryOutput[]> {
    const exists = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    })
    if (exists === null) {
      throw new NotFoundException('User not found')
    }

    const entries = await this.auditLogService.findForEntity('User', userId)
    return entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata !== null ? JSON.stringify(entry.metadata) : null,
      occurredAt: entry.occurredAt,
      actorId: entry.actor.id,
      actorName: entry.actor.fullName,
      actorEmail: entry.actor.email,
    }))
  }

  /** Every assignable Role with its granted Permissions — backs role pickers and the Roles admin page. */
  async listRoles(): Promise<RoleOutput[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    })
    return roles.map((role) => this.mapRoleToOutput(role))
  }

  /**
   * Admin creates a custom Role and grants it existing seeded Permissions
   * (docs/domain-model.md § Role) — never new Permission definitions, which
   * are out of v1 scope (docs/domain-model.md § Permission).
   */
  async createRole(user: AuthenticatedUser, input: CreateRoleInput): Promise<RoleOutput> {
    const permissions = await this.resolvePermissionsByKeys(input.permissionKeys)

    let createdId: string
    try {
      createdId = await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.create({
          data: {
            name: input.name,
            description: input.description ?? null,
            rolePermissions: {
              create: permissions.map((permission) => ({ permissionId: permission.id })),
            },
          },
        })
        await this.auditLogService.record(tx, {
          actorUserId: user.id,
          action: 'ROLE_CREATED',
          entityType: 'Role',
          entityId: role.id,
          metadata: { name: role.name, permissionKeys: input.permissionKeys },
        })
        return role.id
      })
    } catch (error) {
      this.translatePrismaError(error)
    }

    return this.getRoleWithPermissions(createdId)
  }

  /**
   * Replaces a Role's entire granted-Permission set. Rejected for a system
   * Role (Admin/Partner/Customer) — those are seeded and protected from edit
   * (docs/domain-model.md § Role).
   */
  async updateRolePermissions(
    user: AuthenticatedUser,
    input: UpdateRolePermissionsInput,
  ): Promise<RoleOutput> {
    const existing = await this.findActiveRoleOrThrow(input.id)
    if (existing.isSystemRole) {
      throw new BadRequestException('System roles cannot be modified')
    }
    const permissions = await this.resolvePermissionsByKeys(input.permissionKeys)

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: input.id } })
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: input.id, permissionId: permission.id })),
      })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'ROLE_PERMISSIONS_UPDATED',
        entityType: 'Role',
        entityId: input.id,
        metadata: { permissionKeys: input.permissionKeys },
      })
    })

    return this.getRoleWithPermissions(input.id)
  }

  /**
   * Soft-deletes the Role (`deletedAt`) — a real archive, not a status flip
   * like Customer/Order (Role has no separate status enum), same convention
   * as CatalogService.archiveProduct. Prevents new assignment (listRoles
   * filters `deletedAt: null`) but never strips existing UserRole grants,
   * to avoid silently locking anyone out (docs/domain-model.md § Role).
   */
  async archiveRole(user: AuthenticatedUser, id: string): Promise<RoleOutput> {
    const existing = await this.findActiveRoleOrThrow(id)
    if (existing.isSystemRole) {
      throw new BadRequestException('System roles cannot be archived')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id }, data: { deletedAt: new Date() } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'ROLE_ARCHIVED',
        entityType: 'Role',
        entityId: id,
        metadata: { name: existing.name },
      })
    })

    return this.getRoleWithPermissions(id)
  }

  /**
   * Grants a Role to a User. Guarded (docs/authorization.md § User Role
   * Assignment Guardrails):
   *  1. No self-edit — a caller can never change their own Role grants.
   *  2. Granting the Admin Role requires the caller to already hold it
   *     (defense-in-depth: `users:manage` is Admin-only today, but this
   *     protects against a future non-Admin role ever being granted it).
   * Idempotent-rejecting, not idempotent-succeeding: re-granting an
   * already-held Role is a caller error, same as CustomersService's
   * "already suspended" guard.
   */
  async assignUserRole(
    user: AuthenticatedUser,
    userId: string,
    roleId: string,
  ): Promise<UserOutput> {
    this.assertNotSelf(user, userId, 'assign a role to')
    await this.findActiveUserOrThrow(userId)
    const role = await this.findActiveRoleOrThrow(roleId)

    if (role.name === 'Admin' && !user.roles.includes('Admin')) {
      throw new ForbiddenException('Only an existing Admin can grant the Admin role')
    }

    const alreadyAssigned = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })
    if (alreadyAssigned !== null) {
      throw new BadRequestException('User already has this role')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.create({ data: { userId, roleId } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'USER_ROLE_ASSIGNED',
        entityType: 'User',
        entityId: userId,
        metadata: { roleId, roleName: role.name },
      })
    })

    return this.findUserById(user, userId)
  }

  /**
   * Removes a Role from a User. Guarded (docs/authorization.md § User Role
   * Assignment Guardrails):
   *  1. No self-edit — a caller can never change their own Role grants.
   *  2. Removing the Admin Role is rejected if this User is the platform's
   *     last remaining Admin — the platform must always retain at least one.
   * Unlike assignUserRole's role lookup, this does NOT require the Role to
   * still be active: a User may hold a since-archived Role (archiving never
   * strips existing grants, docs/domain-model.md § Role), and support must
   * still be able to remove that stale grant.
   */
  async removeUserRole(
    user: AuthenticatedUser,
    userId: string,
    roleId: string,
  ): Promise<UserOutput> {
    this.assertNotSelf(user, userId, 'remove a role from')
    await this.findActiveUserOrThrow(userId)
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (role === null) {
      throw new NotFoundException('Role not found')
    }

    const assignment = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })
    if (assignment === null) {
      throw new NotFoundException('User does not have this role')
    }

    if (role.name === 'Admin') {
      const adminHolderCount = await this.prisma.userRole.count({ where: { roleId } })
      if (adminHolderCount <= 1) {
        throw new BadRequestException("Cannot remove the platform's last remaining Admin")
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.delete({ where: { userId_roleId: { userId, roleId } } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'USER_ROLE_REMOVED',
        entityType: 'User',
        entityId: userId,
        metadata: { roleId, roleName: role.name },
      })
    })

    return this.findUserById(user, userId)
  }

  /**
   * Suspends a User (ACTIVE -> SUSPENDED, docs/domain-model.md § User
   * Lifecycle) — mirrors CustomersService.archiveCustomer. Guarded the same
   * way as assignUserRole/removeUserRole (docs/authorization.md § User Role
   * Assignment Guardrails, extended to status here): no self-suspension,
   * and rejects suspending the platform's last remaining active Admin — a
   * SUSPENDED User cannot log in (AuthService.validateAndProvisionUser
   * rejects non-ACTIVE status), so this has the same practical effect as
   * removeUserRole's last-Admin guard even though the Role itself is
   * untouched.
   */
  async suspendUser(user: AuthenticatedUser, id: string): Promise<UserOutput> {
    this.assertNotSelf(user, id, 'suspend')
    const existing = await this.findActiveUserOrThrow(id)
    if (existing.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('User is already suspended')
    }

    const holdsAdmin = await this.prisma.userRole.findFirst({
      where: { userId: id, role: { name: 'Admin' } },
    })
    if (holdsAdmin !== null) {
      const otherActiveAdmins = await this.prisma.userRole.count({
        where: {
          role: { name: 'Admin' },
          user: { status: UserStatus.ACTIVE, deletedAt: null, id: { not: id } },
        },
      })
      if (otherActiveAdmins === 0) {
        throw new BadRequestException("Cannot suspend the platform's last remaining active Admin")
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status: UserStatus.SUSPENDED } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'USER_SUSPENDED',
        entityType: 'User',
        entityId: id,
        metadata: { fullName: existing.fullName },
      })
    })

    // Emitted only once the transaction has committed — NotificationEventsListener
    // must never see a suspension that then rolled back (same reasoning as
    // CustomersService.archiveCustomer's identical comment).
    this.eventEmitter.emit(
      UserSuspendedEvent.EVENT_NAME,
      new UserSuspendedEvent(id, existing.fullName),
    )

    return this.findUserById(user, id)
  }

  /** Reverses suspendUser — the lifecycle is bidirectional (docs/domain-model.md § User Lifecycle: Active ⇄ Suspended). */
  async reactivateUser(user: AuthenticatedUser, id: string): Promise<UserOutput> {
    this.assertNotSelf(user, id, 'reactivate')
    const existing = await this.findActiveUserOrThrow(id)
    if (existing.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status: UserStatus.ACTIVE } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'USER_REACTIVATED',
        entityType: 'User',
        entityId: id,
        metadata: { fullName: existing.fullName },
      })
    })

    this.eventEmitter.emit(
      UserReactivatedEvent.EVENT_NAME,
      new UserReactivatedEvent(id, existing.fullName),
    )

    return this.findUserById(user, id)
  }

  private assertNotSelf(user: AuthenticatedUser, targetUserId: string, action: string): void {
    if (targetUserId === user.id) {
      throw new ForbiddenException(`Cannot ${action} yourself — ask another Admin`)
    }
  }

  private async findActiveUserOrThrow(
    id: string,
  ): Promise<{ id: string; fullName: string; status: UserStatus }> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, fullName: true, status: true },
    })
    if (row === null) {
      throw new NotFoundException('User not found')
    }
    return row
  }

  /** Resolves seeded Permission keys to rows, rejecting any that don't exist. */
  private async resolvePermissionsByKeys(
    keys: string[],
  ): Promise<Array<{ id: string; key: string }>> {
    const uniqueKeys = [...new Set(keys)]
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: uniqueKeys } },
    })
    if (permissions.length !== uniqueKeys.length) {
      const foundKeys = new Set(permissions.map((permission) => permission.key))
      const missingKeys = uniqueKeys.filter((key) => !foundKeys.has(key))
      throw new BadRequestException(`Unknown permission key(s): ${missingKeys.join(', ')}`)
    }
    return permissions
  }

  /** Existence + not-already-archived check before a Role mutation — never reached for a system Role's protected fields alone (that check happens at the call site, after this). */
  private async findActiveRoleOrThrow(
    id: string,
  ): Promise<{ id: string; name: string; isSystemRole: boolean }> {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, isSystemRole: true },
    })
    if (role === null) {
      throw new NotFoundException('Role not found')
    }
    return role
  }

  /** Refetches a Role with its Permissions for a mutation's return value — deliberately not `deletedAt`-filtered, since archiveRole must still return the row it just archived. */
  private async getRoleWithPermissions(id: string): Promise<RoleOutput> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    })
    return this.mapRoleToOutput(role)
  }

  private translatePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A role with this name already exists')
    }
    throw error
  }

  private buildWhere(filter: UserFilterInput | undefined): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = { deletedAt: null }
    const status = filter?.status ?? undefined
    const ownerType = filter?.ownerType ?? undefined
    const search = filter?.search ?? undefined

    if (status !== undefined) where.status = status
    if (ownerType !== undefined) where.ownerType = ownerType
    if (search !== undefined && search.trim() !== '') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ]
    }

    return where
  }

  // `id` breaks ties: two rows sharing the exact same sorted field value
  // could otherwise skip or repeat across cursor-paginated pages, same
  // reasoning as CustomersService.buildOrderBy.
  private buildOrderBy(sort: UserSortInput | undefined): Prisma.UserOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === UserSortField.EMAIL) {
      return [{ email: direction }, { id: 'asc' }]
    }
    if (sort?.field === UserSortField.FULL_NAME) {
      return [{ fullName: direction }, { id: 'asc' }]
    }
    return [{ createdAt: direction }, { id: 'asc' }]
  }

  private mapUserToOutput(user: UserWithRoles): UserOutput {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      ownerType: user.ownerType,
      partnerId: user.partnerId,
      customerId: user.customerId,
      roles: user.userRoles.map((userRole) => this.mapRoleToOutput(userRole.role)),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  private mapRoleToOutput(role: RoleWithPermissions): RoleOutput {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.isSystemRole,
      permissions: role.rolePermissions.map((rolePermission) => ({
        id: rolePermission.permission.id,
        key: rolePermission.permission.key,
        description: rolePermission.permission.description,
        domain: rolePermission.permission.domain,
      })),
    }
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id, 'utf8').toString('base64')
  }

  private decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf8')
  }
}
