import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, UserOwnerType, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { UserSortField } from './dto/user-sort.enum'
import { UserInvitedEvent } from './events/user-invited.event'
import { UserReactivatedEvent } from './events/user-reactivated.event'
import { UserSuspendedEvent } from './events/user-suspended.event'
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

function roleWithPermissionsFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-custom-1',
    name: 'Support Agent',
    description: 'Read-only support access',
    isSystemRole: false,
    rolePermissions: [
      {
        permission: {
          id: 'perm-orders-read',
          key: 'orders:read',
          description: 'View orders',
          domain: 'orders',
        },
      },
    ],
    ...overrides,
  }
}

describe('UsersService', () => {
  let service: UsersService
  let prisma: {
    user: {
      findMany: jest.Mock
      findFirst: jest.Mock
      findUnique: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    partner: { findFirst: jest.Mock }
    customer: { findFirst: jest.Mock }
    role: {
      findMany: jest.Mock
      findFirst: jest.Mock
      findUnique: jest.Mock
      findUniqueOrThrow: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    rolePermission: { deleteMany: jest.Mock; createMany: jest.Mock }
    permission: { findMany: jest.Mock }
    userRole: {
      findUnique: jest.Mock
      findFirst: jest.Mock
      count: jest.Mock
      create: jest.Mock
      delete: jest.Mock
    }
    $transaction: jest.Mock
  }
  let auditLogService: { record: jest.Mock; findForEntity: jest.Mock }
  let eventEmitter: { emit: jest.Mock }
  let keycloakAdminService: { createUser: jest.Mock; sendExecuteActionsEmail: jest.Mock }
  let logger: { error: jest.Mock }

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      partner: { findFirst: jest.fn() },
      customer: { findFirst: jest.fn() },
      role: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
      permission: { findMany: jest.fn() },
      userRole: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    auditLogService = { record: jest.fn(), findForEntity: jest.fn() }
    eventEmitter = { emit: jest.fn() }
    keycloakAdminService = { createUser: jest.fn(), sendExecuteActionsEmail: jest.fn() }
    logger = { error: jest.fn() }
    service = new UsersService(
      prisma as never,
      auditLogService as never,
      eventEmitter as never,
      keycloakAdminService as never,
      logger as never,
    )
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

  describe('createRole', () => {
    it('rejects an unknown permission key without writing anything', async () => {
      prisma.permission.findMany.mockResolvedValueOnce([
        { id: 'perm-orders-read', key: 'orders:read' },
      ])

      await expect(
        service.createRole(user(), {
          name: 'Support Agent',
          permissionKeys: ['orders:read', 'not-a-real-key'],
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.role.create).not.toHaveBeenCalled()
    })

    it('translates a duplicate name (P2002) to CONFLICT', async () => {
      prisma.permission.findMany.mockResolvedValueOnce([
        { id: 'perm-orders-read', key: 'orders:read' },
      ])
      prisma.role.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      )

      await expect(
        service.createRole(user(), { name: 'Support Agent', permissionKeys: ['orders:read'] }),
      ).rejects.toThrow(ConflictException)
    })

    it('creates the Role, grants the resolved permissions, and records an audit entry', async () => {
      prisma.permission.findMany.mockResolvedValueOnce([
        { id: 'perm-orders-read', key: 'orders:read' },
      ])
      prisma.role.create.mockResolvedValueOnce({ id: 'role-custom-1', name: 'Support Agent' })
      prisma.role.findUniqueOrThrow.mockResolvedValueOnce(roleWithPermissionsFixture())

      const result = await service.createRole(user(), {
        name: 'Support Agent',
        permissionKeys: ['orders:read'],
      })

      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Support Agent',
            rolePermissions: { create: [{ permissionId: 'perm-orders-read' }] },
          }) as unknown,
        }),
      )
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'ROLE_CREATED', entityId: 'role-custom-1' }),
      )
      expect(result.name).toBe('Support Agent')
    })
  })

  describe('updateRolePermissions', () => {
    it('throws NOT_FOUND when the role does not exist', async () => {
      prisma.role.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.updateRolePermissions(user(), { id: 'role-1', permissionKeys: ['orders:read'] }),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects modifying a system Role', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-admin',
        name: 'Admin',
        isSystemRole: true,
      })

      await expect(
        service.updateRolePermissions(user(), {
          id: 'role-admin',
          permissionKeys: ['orders:read'],
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled()
    })

    it('replaces the permission set (delete then recreate) and records an audit entry', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-custom-1',
        name: 'Support Agent',
        isSystemRole: false,
      })
      prisma.permission.findMany.mockResolvedValueOnce([
        { id: 'perm-orders-read', key: 'orders:read' },
        { id: 'perm-billing-read', key: 'billing:read' },
      ])
      prisma.role.findUniqueOrThrow.mockResolvedValueOnce(
        roleWithPermissionsFixture({
          rolePermissions: [
            { permission: { id: 'perm-orders-read', key: 'orders:read' } },
            { permission: { id: 'perm-billing-read', key: 'billing:read' } },
          ],
        }),
      )

      await service.updateRolePermissions(user(), {
        id: 'role-custom-1',
        permissionKeys: ['orders:read', 'billing:read'],
      })

      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-custom-1' },
      })
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: 'role-custom-1', permissionId: 'perm-orders-read' },
          { roleId: 'role-custom-1', permissionId: 'perm-billing-read' },
        ],
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          action: 'ROLE_PERMISSIONS_UPDATED',
          entityId: 'role-custom-1',
        }),
      )
    })
  })

  describe('archiveRole', () => {
    it('throws NOT_FOUND when the role does not exist (or is already archived)', async () => {
      prisma.role.findFirst.mockResolvedValueOnce(null)

      await expect(service.archiveRole(user(), 'role-1')).rejects.toThrow(NotFoundException)
    })

    it('rejects archiving a system Role', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-admin',
        name: 'Admin',
        isSystemRole: true,
      })

      await expect(service.archiveRole(user(), 'role-admin')).rejects.toThrow(BadRequestException)
      expect(prisma.role.update).not.toHaveBeenCalled()
    })

    it('soft-deletes the role and records an audit entry, without touching RolePermission rows', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-custom-1',
        name: 'Support Agent',
        isSystemRole: false,
      })
      prisma.role.findUniqueOrThrow.mockResolvedValueOnce(roleWithPermissionsFixture())

      await service.archiveRole(user(), 'role-custom-1')

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-custom-1' },
        data: { deletedAt: expect.any(Date) as Date },
      })
      expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled()
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'ROLE_ARCHIVED', entityId: 'role-custom-1' }),
      )
    })
  })

  describe('inviteUser', () => {
    const baseInvite = {
      email: 'yash.lakhani+invitee@smartsensesolutions.com',
      fullName: 'Riley Morgan',
      ownerType: UserOwnerType.NONE,
      roleIds: ['role-custom-1'],
    }

    function stubHappyPath(): void {
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-custom-1', name: 'Support Agent' }])
      prisma.user.findUnique.mockResolvedValueOnce(null)
      keycloakAdminService.createUser.mockResolvedValueOnce('kc-new-1')
      prisma.user.create.mockResolvedValueOnce({ id: 'user-new-1' })
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture({ id: 'user-new-1' }))
      keycloakAdminService.sendExecuteActionsEmail.mockResolvedValueOnce(undefined)
    }

    it('rejects a NONE-owner user carrying a partnerId, before any external call', async () => {
      await expect(
        service.inviteUser(user(), { ...baseInvite, partnerId: 'partner-1' }),
      ).rejects.toThrow(BadRequestException)
      expect(keycloakAdminService.createUser).not.toHaveBeenCalled()
    })

    it('rejects a PARTNER-owner user with no partnerId', async () => {
      await expect(
        service.inviteUser(user(), { ...baseInvite, ownerType: UserOwnerType.PARTNER }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects when the referenced partner does not exist', async () => {
      prisma.partner.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.inviteUser(user(), {
          ...baseInvite,
          ownerType: UserOwnerType.PARTNER,
          partnerId: 'partner-1',
        }),
      ).rejects.toThrow(BadRequestException)
      expect(keycloakAdminService.createUser).not.toHaveBeenCalled()
    })

    it('rejects an unknown or archived role id', async () => {
      prisma.partner.findFirst.mockResolvedValueOnce({ id: 'partner-1' })
      prisma.role.findMany.mockResolvedValueOnce([])

      await expect(
        service.inviteUser(user(), {
          ...baseInvite,
          ownerType: UserOwnerType.PARTNER,
          partnerId: 'partner-1',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects granting the Admin role when the caller is not an Admin, before provisioning', async () => {
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-admin', name: 'Admin' }])

      await expect(
        service.inviteUser(user({ roles: ['Partner'] }), {
          ...baseInvite,
          roleIds: ['role-admin'],
        }),
      ).rejects.toThrow(ForbiddenException)
      expect(keycloakAdminService.createUser).not.toHaveBeenCalled()
    })

    it('rejects a re-invite for an email that already has a local user, before Keycloak', async () => {
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-custom-1', name: 'Support Agent' }])
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-user' })

      await expect(service.inviteUser(user(), baseInvite)).rejects.toThrow(ConflictException)
      expect(keycloakAdminService.createUser).not.toHaveBeenCalled()
    })

    it('provisions Keycloak, creates an INVITED user with roles, audits, notifies, and mails', async () => {
      stubHappyPath()

      const result = await service.inviteUser(user(), baseInvite)

      expect(keycloakAdminService.createUser).toHaveBeenCalledWith({
        email: baseInvite.email,
        firstName: 'Riley',
        lastName: 'Morgan',
        requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
      })
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keycloakSubjectId: 'kc-new-1',
            email: baseInvite.email,
            status: UserStatus.INVITED,
            ownerType: UserOwnerType.NONE,
            partnerId: null,
            customerId: null,
            userRoles: { create: [{ roleId: 'role-custom-1' }] },
          }) as unknown,
        }),
      )
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_INVITED', entityId: 'user-new-1' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UserInvitedEvent.EVENT_NAME,
        expect.objectContaining({ userId: 'user-new-1' }),
      )
      expect(keycloakAdminService.sendExecuteActionsEmail).toHaveBeenCalledWith('kc-new-1', [
        'UPDATE_PASSWORD',
        'VERIFY_EMAIL',
      ])
      expect(result.id).toBe('user-new-1')
    })

    it('logs for manual reconciliation and rethrows when the DB transaction fails after Keycloak', async () => {
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-custom-1', name: 'Support Agent' }])
      prisma.user.findUnique.mockResolvedValueOnce(null)
      keycloakAdminService.createUser.mockResolvedValueOnce('kc-orphan-1')
      prisma.user.create.mockRejectedValueOnce(new Error('db down'))

      await expect(service.inviteUser(user(), baseInvite)).rejects.toThrow('db down')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('kc-orphan-1'),
        expect.anything(),
        'UsersService',
      )
      expect(keycloakAdminService.sendExecuteActionsEmail).not.toHaveBeenCalled()
    })

    it('does not fail the invite when the invite email fails to send (logs instead)', async () => {
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-custom-1', name: 'Support Agent' }])
      prisma.user.findUnique.mockResolvedValueOnce(null)
      keycloakAdminService.createUser.mockResolvedValueOnce('kc-new-1')
      prisma.user.create.mockResolvedValueOnce({ id: 'user-new-1' })
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture({ id: 'user-new-1' }))
      keycloakAdminService.sendExecuteActionsEmail.mockRejectedValueOnce(new Error('smtp down'))

      const result = await service.inviteUser(user(), baseInvite)

      expect(result.id).toBe('user-new-1')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('throws NOT_FOUND when the user does not exist, without calling Keycloak', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.sendPasswordResetEmail(user(), 'user-1')).rejects.toThrow(
        NotFoundException,
      )
      expect(keycloakAdminService.sendExecuteActionsEmail).not.toHaveBeenCalled()
    })

    it('rejects a non-ACTIVE target (e.g. still INVITED) before calling Keycloak', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'yash.lakhani+invitee@smartsensesolutions.com',
        status: UserStatus.INVITED,
        keycloakSubjectId: 'kc-1',
      })

      await expect(service.sendPasswordResetEmail(user(), 'user-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(keycloakAdminService.sendExecuteActionsEmail).not.toHaveBeenCalled()
    })

    it('triggers the UPDATE_PASSWORD email, audits, and returns true for an ACTIVE user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'yash.lakhani+jordan@smartsensesolutions.com',
        status: UserStatus.ACTIVE,
        keycloakSubjectId: 'kc-jordan-1',
      })
      keycloakAdminService.sendExecuteActionsEmail.mockResolvedValueOnce(undefined)

      const result = await service.sendPasswordResetEmail(user(), 'user-1')

      expect(keycloakAdminService.sendExecuteActionsEmail).toHaveBeenCalledWith('kc-jordan-1', [
        'UPDATE_PASSWORD',
      ])
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_PASSWORD_RESET_SENT', entityId: 'user-1' }),
      )
      expect(result).toBe(true)
    })
  })

  describe('assignUserRole — guardrails', () => {
    it('rejects a caller assigning a role to themselves', async () => {
      await expect(
        service.assignUserRole(user({ id: 'admin-1' }), 'admin-1', 'role-custom-1'),
      ).rejects.toThrow(ForbiddenException)
      expect(prisma.user.findFirst).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when the target user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.assignUserRole(user(), 'user-1', 'role-custom-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws NOT_FOUND when the role does not exist or is archived', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findFirst.mockResolvedValueOnce(null)

      await expect(service.assignUserRole(user(), 'user-1', 'role-custom-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('rejects granting the Admin role when the caller is not themselves an Admin', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-admin',
        name: 'Admin',
        isSystemRole: true,
      })

      await expect(
        service.assignUserRole(
          user({ id: 'partner-user-1', roles: ['Partner'] }),
          'user-1',
          'role-admin',
        ),
      ).rejects.toThrow(ForbiddenException)
      expect(prisma.userRole.create).not.toHaveBeenCalled()
    })

    it('lets an Admin caller grant the Admin role to someone else', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-admin',
        name: 'Admin',
        isSystemRole: true,
      })
      prisma.userRole.findUnique.mockResolvedValueOnce(null)
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.assignUserRole(
        user({ id: 'admin-1', roles: ['Admin'] }),
        'user-1',
        'role-admin',
      )

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', roleId: 'role-admin' },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_ROLE_ASSIGNED', entityId: 'user-1' }),
      )
    })

    it('rejects re-granting a role the user already has', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-custom-1',
        name: 'Support Agent',
        isSystemRole: false,
      })
      prisma.userRole.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        roleId: 'role-custom-1',
      })

      await expect(service.assignUserRole(user(), 'user-1', 'role-custom-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.userRole.create).not.toHaveBeenCalled()
    })

    it('does not require Admin-holding to grant a non-Admin role', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-custom-1',
        name: 'Support Agent',
        isSystemRole: false,
      })
      prisma.userRole.findUnique.mockResolvedValueOnce(null)
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await expect(
        service.assignUserRole(
          user({ id: 'partner-user-1', roles: ['Partner'] }),
          'user-1',
          'role-custom-1',
        ),
      ).resolves.toBeDefined()
    })
  })

  describe('removeUserRole — guardrails', () => {
    it('rejects a caller removing a role from themselves', async () => {
      await expect(
        service.removeUserRole(user({ id: 'admin-1' }), 'admin-1', 'role-admin'),
      ).rejects.toThrow(ForbiddenException)
      expect(prisma.user.findFirst).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when the target user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.removeUserRole(user(), 'user-1', 'role-admin')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws NOT_FOUND when the user does not currently hold this role', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findUnique.mockResolvedValueOnce({ id: 'role-custom-1', name: 'Support Agent' })
      prisma.userRole.findUnique.mockResolvedValueOnce(null)

      await expect(service.removeUserRole(user(), 'user-1', 'role-custom-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it("rejects removing the Admin role from the platform's last remaining Admin", async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findUnique.mockResolvedValueOnce({ id: 'role-admin', name: 'Admin' })
      prisma.userRole.findUnique.mockResolvedValueOnce({ userId: 'user-1', roleId: 'role-admin' })
      prisma.userRole.count.mockResolvedValueOnce(1)

      await expect(service.removeUserRole(user(), 'user-1', 'role-admin')).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.userRole.delete).not.toHaveBeenCalled()
    })

    it('lets the Admin role be removed from a User when other Admins remain', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findUnique.mockResolvedValueOnce({ id: 'role-admin', name: 'Admin' })
      prisma.userRole.findUnique.mockResolvedValueOnce({ userId: 'user-1', roleId: 'role-admin' })
      prisma.userRole.count.mockResolvedValueOnce(2)
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.removeUserRole(user(), 'user-1', 'role-admin')

      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-admin' } },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_ROLE_REMOVED', entityId: 'user-1' }),
      )
    })

    it('does not check Admin-holder count when removing a non-Admin role', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' })
      prisma.role.findUnique.mockResolvedValueOnce({ id: 'role-custom-1', name: 'Support Agent' })
      prisma.userRole.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        roleId: 'role-custom-1',
      })
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.removeUserRole(user(), 'user-1', 'role-custom-1')

      expect(prisma.userRole.count).not.toHaveBeenCalled()
      expect(prisma.userRole.delete).toHaveBeenCalled()
    })
  })

  describe('suspendUser', () => {
    it('rejects a caller suspending themselves', async () => {
      await expect(service.suspendUser(user({ id: 'admin-1' }), 'admin-1')).rejects.toThrow(
        ForbiddenException,
      )
      expect(prisma.user.findFirst).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when the target user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.suspendUser(user(), 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('rejects suspending an already-suspended user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.SUSPENDED,
      })

      await expect(service.suspendUser(user(), 'user-1')).rejects.toThrow(BadRequestException)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it("rejects suspending the platform's last remaining active Admin", async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.ACTIVE,
      })
      prisma.userRole.findFirst.mockResolvedValueOnce({ userId: 'user-1', roleId: 'role-admin' })
      prisma.userRole.count.mockResolvedValueOnce(0)

      await expect(service.suspendUser(user(), 'user-1')).rejects.toThrow(BadRequestException)
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(eventEmitter.emit).not.toHaveBeenCalled()
    })

    it('suspends an Admin when other active Admins remain', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.ACTIVE,
      })
      prisma.userRole.findFirst.mockResolvedValueOnce({ userId: 'user-1', roleId: 'role-admin' })
      prisma.userRole.count.mockResolvedValueOnce(1)
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.suspendUser(user(), 'user-1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: UserStatus.SUSPENDED },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_SUSPENDED', entityId: 'user-1' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UserSuspendedEvent.EVENT_NAME,
        expect.objectContaining({ userId: 'user-1', fullName: 'Jordan Rivera' }),
      )
    })

    it('does not check Admin-holder count for a non-Admin user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.ACTIVE,
      })
      prisma.userRole.findFirst.mockResolvedValueOnce(null)
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.suspendUser(user(), 'user-1')

      expect(prisma.userRole.count).not.toHaveBeenCalled()
      expect(prisma.user.update).toHaveBeenCalled()
    })
  })

  describe('reactivateUser', () => {
    it('rejects a caller reactivating themselves', async () => {
      await expect(service.reactivateUser(user({ id: 'admin-1' }), 'admin-1')).rejects.toThrow(
        ForbiddenException,
      )
      expect(prisma.user.findFirst).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when the target user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null)

      await expect(service.reactivateUser(user(), 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('rejects reactivating an already-active user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.ACTIVE,
      })

      await expect(service.reactivateUser(user(), 'user-1')).rejects.toThrow(BadRequestException)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('reactivates a suspended user, records an audit entry, and emits the event', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        fullName: 'Jordan Rivera',
        status: UserStatus.SUSPENDED,
      })
      prisma.user.findFirst.mockResolvedValueOnce(userRowFixture())

      await service.reactivateUser(user(), 'user-1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: UserStatus.ACTIVE },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'USER_REACTIVATED', entityId: 'user-1' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UserReactivatedEvent.EVENT_NAME,
        expect.objectContaining({ userId: 'user-1', fullName: 'Jordan Rivera' }),
      )
    })
  })
})
