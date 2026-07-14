import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { AuditLogEntryOutput } from '../../common/graphql/audit-log-entry.output'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { RoleOutput } from './dto/role.output'
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
