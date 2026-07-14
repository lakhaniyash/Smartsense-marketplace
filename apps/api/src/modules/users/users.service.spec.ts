import { NotFoundException } from '@nestjs/common'
import { UserOwnerType, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { UserSortField } from './dto/user-sort.enum'
import { UsersService } from './users.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'admin-1',
    keycloakSubjectId: 'kc-admin-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test Admin',
    status: UserStatus.ACTIVE,
    roles: ['Admin'],
    permissions: ['users:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function userRowFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'yash.lakhani+jordan@smartsensesolutions.com',
    fullName: 'Jordan Rivera',
    status: UserStatus.ACTIVE,
    ownerType: UserOwnerType.NONE,
    partnerId: null,
    customerId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userRoles: [
      {
        role: {
          id: 'role-admin',
          name: 'Admin',
          description: 'Platform operator',
          isSystemRole: true,
          rolePermissions: [
            {
              permission: {
                id: 'perm-1',
                key: 'users:read',
                description: 'View platform users',
                domain: 'users',
              },
            },
          ],
        },
      },
    ],
    ...overrides,
  }
}

describe('UsersService', () => {
  let service: UsersService
  let prisma: {
    user: { findMany: jest.Mock; findFirst: jest.Mock }
    role: { findMany: jest.Mock }
  }
  let auditLogService: { record: jest.Mock; findForEntity: jest.Mock }

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn(), findFirst: jest.fn() },
      role: { findMany: jest.fn() },
    }
    auditLogService = { record: jest.fn(), findForEntity: jest.fn() }
    service = new UsersService(prisma as never, auditLogService as never)
  })

  describe('findUsers', () => {
    it('filters deletedAt: null and maps status/ownerType/search into the where clause', async () => {
      prisma.user.findMany.mockResolvedValueOnce([])

      await service.findUsers(user(), {
        filter: {
          status: UserStatus.SUSPENDED,
          ownerType: UserOwnerType.PARTNER,
          search: 'jordan',
        },
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            status: UserStatus.SUSPENDED,
            ownerType: UserOwnerType.PARTNER,
            OR: [
              { email: { contains: 'jordan', mode: 'insensitive' } },
              { fullName: { contains: 'jordan', mode: 'insensitive' } },
            ],
          },
        }),
      )
    })

    it('sorts by email when requested, tie-breaking on id', async () => {
      prisma.user.findMany.mockResolvedValueOnce([])

      await service.findUsers(user(), {
        sort: { field: UserSortField.EMAIL, direction: SortDirection.ASC },
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ email: 'asc' }, { id: 'asc' }] }),
      )
    })

    it('reports hasNextPage when more rows exist than the requested page size', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        userRowFixture({ id: 'user-1' }),
        userRowFixture({ id: 'user-2' }),
      ])

      const result = await service.findUsers(user(), { first: 1 })

      expect(result.edges).toHaveLength(1)
      expect(result.pageInfo.hasNextPage).toBe(true)
    })

    it('maps a row into its roles/permissions shape', async () => {
      prisma.user.findMany.mockResolvedValueOnce([userRowFixture()])

      const result = await service.findUsers(user(), {})

      expect(result.edges[0]?.node).toMatchObject({
        id: 'user-1',
        email: 'yash.lakhani+jordan@smartsensesolutions.com',
        roles: [
          expect.objectContaining({
            name: 'Admin',
            permissions: [expect.objectContaining({ key: 'users:read' })],
          }),
        ],
      })
    })
  })

  describe('findUserById', () => {
    it('throws NOT_FOUND when the user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.findUserById(user(), 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('returns the mapped user when found', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      const result = await service.findUserById(user(), 'user-1')

      expect(result.id).toBe('user-1')
      expect(result.roles[0]?.name).toBe('Admin')
    })
  })

  describe('getAuditLog', () => {
    it("throws NOT_FOUND when the user doesn't exist, without calling findForEntity", async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.getAuditLog(user(), 'user-1')).rejects.toThrow(NotFoundException)
      expect(auditLogService.findForEntity).not.toHaveBeenCalled()
    })

    it('maps entries, JSON-encoding metadata and flattening the actor', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      auditLogService.findForEntity.mockResolvedValueOnce([
        {
          id: 'log-1',
          action: 'USER_INVITED',
          entityType: 'User',
          entityId: 'user-1',
          metadata: { email: 'yash.lakhani+jordan@smartsensesolutions.com' },
          occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          actor: {
            id: 'admin-1',
            fullName: 'Test Admin',
            email: 'yash.lakhani+test@smartsensesolutions.com',
          },
        },
      ])

      const result = await service.getAuditLog(user(), 'user-1')

      expect(auditLogService.findForEntity).toHaveBeenCalledWith('User', 'user-1')
      expect(result).toEqual([
        {
          id: 'log-1',
          action: 'USER_INVITED',
          entityType: 'User',
          entityId: 'user-1',
          metadata: '{"email":"yash.lakhani+jordan@smartsensesolutions.com"}',
          occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          actorId: 'admin-1',
          actorName: 'Test Admin',
          actorEmail: 'yash.lakhani+test@smartsensesolutions.com',
        },
      ])
    })
  })

  describe('listRoles', () => {
    it('filters deletedAt: null and maps each role with its permissions', async () => {
      prisma.role.findMany.mockResolvedValueOnce([
        {
          id: 'role-admin',
          name: 'Admin',
          description: 'Platform operator',
          isSystemRole: true,
          rolePermissions: [
            {
              permission: {
                id: 'perm-1',
                key: 'users:manage',
                description: 'Manage users',
                domain: 'users',
              },
            },
          ],
        },
      ])

      const result = await service.listRoles()

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      )
      expect(result).toEqual([
        {
          id: 'role-admin',
          name: 'Admin',
          description: 'Platform operator',
          isSystemRole: true,
          permissions: [
            { id: 'perm-1', key: 'users:manage', description: 'Manage users', domain: 'users' },
          ],
        },
      ])
    })
  })
})
