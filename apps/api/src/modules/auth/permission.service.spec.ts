import { UserStatus } from '@prisma/client'
import { PermissionService } from './permission.service'
import { type AuthenticatedUser } from './types/auth-context.type'

describe('PermissionService', () => {
  let service: PermissionService
  let prisma: { userRole: { findMany: jest.Mock } }

  beforeEach(() => {
    prisma = { userRole: { findMany: jest.fn() } }
    service = new PermissionService(prisma as never)
  })

  const user = (permissions: string[]): AuthenticatedUser => ({
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'A B',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions,
  })

  describe('getPermissionKeysForUser', () => {
    it('flattens and dedupes permission keys across multiple roles', async () => {
      prisma.userRole.findMany.mockResolvedValueOnce([
        {
          role: {
            rolePermissions: [
              { permission: { key: 'catalog:read' } },
              { permission: { key: 'catalog:write' } },
            ],
          },
        },
        {
          role: {
            rolePermissions: [
              { permission: { key: 'catalog:read' } }, // duplicate across roles
              { permission: { key: 'orders:read' } },
            ],
          },
        },
      ])

      const keys = await service.getPermissionKeysForUser('user-1')

      expect(keys.sort()).toEqual(['catalog:read', 'catalog:write', 'orders:read'])
    })

    it('returns an empty array when the user has no roles', async () => {
      prisma.userRole.findMany.mockResolvedValueOnce([])
      expect(await service.getPermissionKeysForUser('user-1')).toEqual([])
    })
  })

  describe('can', () => {
    it('allows a permission present in the resolved set', () => {
      expect(service.can(user(['catalog:write']), 'catalog:write')).toBe(true)
    })

    it('denies by default when the permission is absent', () => {
      expect(service.can(user([]), 'catalog:write')).toBe(false)
    })
  })

  describe('canAll', () => {
    it('requires every listed permission (AND semantics)', () => {
      const withBoth = user(['catalog:write', 'orders:read'])
      expect(service.canAll(withBoth, ['catalog:write', 'orders:read'])).toBe(true)
      expect(service.canAll(withBoth, ['catalog:write', 'billing:manage'])).toBe(false)
    })

    it('is vacuously true for an empty requirement list', () => {
      expect(service.canAll(user([]), [])).toBe(true)
    })
  })
})
