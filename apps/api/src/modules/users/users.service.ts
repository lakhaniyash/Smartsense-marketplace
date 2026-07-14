import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
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
