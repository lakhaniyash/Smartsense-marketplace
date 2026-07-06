import { UnauthorizedException } from '@nestjs/common'
import { UserStatus } from '@prisma/client'
import { AuthService } from './auth.service'
import { type PermissionService } from './permission.service'
import { type KeycloakJwtPayload } from './types/auth-context.type'

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock }
    role: { findMany: jest.Mock }
    userRole: { upsert: jest.Mock; findMany: jest.Mock }
  }
  let permissionService: jest.Mocked<Pick<PermissionService, 'getPermissionKeysForUser'>>
  let logger: { warn: jest.Mock; error: jest.Mock; log: jest.Mock }

  const activeUser = {
    id: 'user-1',
    keycloakSubjectId: 'kc-sub-1',
    email: 'yash.lakhani+admin@smartsensesolutions.com',
    fullName: 'Admin User',
    status: UserStatus.ACTIVE,
    partnerId: null,
    customerId: null,
  }

  const payload: KeycloakJwtPayload = {
    sub: 'kc-sub-1',
    iss: 'http://localhost:8080/realms/smartsense-marketplace',
    email: 'yash.lakhani+admin@smartsensesolutions.com',
    realm_access: { roles: ['Admin'] },
    exp: Math.floor(Date.now() / 1000) + 900,
    iat: Math.floor(Date.now() / 1000),
  }

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      role: { findMany: jest.fn() },
      userRole: { upsert: jest.fn(), findMany: jest.fn() },
    }
    permissionService = { getPermissionKeysForUser: jest.fn() }
    logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() }

    service = new AuthService(
      prisma as never,
      permissionService as unknown as PermissionService,
      logger as never,
    )
  })

  describe('getStatus', () => {
    it('returns the fixed status string', () => {
      expect(service.getStatus()).toBe('auth module initialized')
    })
  })

  describe('validateAndProvisionUser', () => {
    it('resolves an existing user by keycloakSubjectId without an email lookup', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser)
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-admin', name: 'Admin' }])
      prisma.userRole.findMany.mockResolvedValueOnce([{ role: { name: 'Admin' } }])
      permissionService.getPermissionKeysForUser.mockResolvedValueOnce(['catalog:write'])

      const result = await service.validateAndProvisionUser(payload)

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { keycloakSubjectId: 'kc-sub-1' },
      })
      expect(result).toEqual({
        id: 'user-1',
        keycloakSubjectId: 'kc-sub-1',
        email: 'yash.lakhani+admin@smartsensesolutions.com',
        fullName: 'Admin User',
        status: UserStatus.ACTIVE,
        roles: ['Admin'],
        permissions: ['catalog:write'],
        partnerId: null,
        customerId: null,
      })
    })

    it('falls back to email lookup and attaches the real subject id on first login', async () => {
      const pendingUser = { ...activeUser, keycloakSubjectId: 'seed-admin-placeholder' }
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // by subject
        .mockResolvedValueOnce(pendingUser) // by email
      prisma.user.update.mockResolvedValueOnce(activeUser)
      prisma.role.findMany.mockResolvedValueOnce([])
      prisma.userRole.findMany.mockResolvedValueOnce([])
      permissionService.getPermissionKeysForUser.mockResolvedValueOnce([])

      const result = await service.validateAndProvisionUser(payload)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { keycloakSubjectId: 'kc-sub-1' },
      })
      expect(result.keycloakSubjectId).toBe('kc-sub-1')
    })

    it('fails closed when no user matches subject or email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

      await expect(service.validateAndProvisionUser(payload)).rejects.toThrow(UnauthorizedException)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('rejects a resolved user who is not ACTIVE', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...activeUser, status: UserStatus.SUSPENDED })

      await expect(service.validateAndProvisionUser(payload)).rejects.toThrow(UnauthorizedException)
      expect(prisma.role.findMany).not.toHaveBeenCalled()
    })

    it('ignores and logs unknown Keycloak roles without granting access', async () => {
      const payloadWithUnknownRole: KeycloakJwtPayload = {
        ...payload,
        realm_access: { roles: ['NotARealRole'] },
      }
      prisma.user.findUnique.mockResolvedValueOnce(activeUser)
      prisma.role.findMany.mockResolvedValueOnce([]) // nothing matches
      prisma.userRole.findMany.mockResolvedValueOnce([])
      permissionService.getPermissionKeysForUser.mockResolvedValueOnce([])

      await service.validateAndProvisionUser(payloadWithUnknownRole)

      expect(prisma.userRole.upsert).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('NotARealRole'),
        AuthService.name,
      )
    })

    it('upserts UserRole for every known system role in the token', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser)
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-admin', name: 'Admin' }])
      prisma.userRole.findMany.mockResolvedValueOnce([{ role: { name: 'Admin' } }])
      permissionService.getPermissionKeysForUser.mockResolvedValueOnce([])

      await service.validateAndProvisionUser(payload)

      expect(prisma.userRole.upsert).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-admin' } },
        create: { userId: 'user-1', roleId: 'role-admin' },
        update: {},
      })
    })

    it('skips role sync entirely when the token carries no roles', async () => {
      const payloadWithNoRoles: KeycloakJwtPayload = { ...payload, realm_access: { roles: [] } }
      prisma.user.findUnique.mockResolvedValueOnce(activeUser)
      prisma.userRole.findMany.mockResolvedValueOnce([])
      permissionService.getPermissionKeysForUser.mockResolvedValueOnce([])

      await service.validateAndProvisionUser(payloadWithNoRoles)

      expect(prisma.role.findMany).not.toHaveBeenCalled()
    })
  })
})
