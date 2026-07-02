import { ForbiddenException, type ExecutionContext } from '@nestjs/common'
import { type Reflector } from '@nestjs/core'
import { UserStatus } from '@prisma/client'
import { type PermissionService } from '../permission.service'
import { type AuthenticatedUser } from '../types/auth-context.type'
import { PermissionGuard } from './permission.guard'

function fakeGqlContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getType: () => 'graphql',
    getArgs: () => [undefined, undefined, { req: { user } }, undefined],
    getClass: () => class {},
    getHandler: () => function handler() {},
  } as unknown as ExecutionContext
}

describe('PermissionGuard', () => {
  let guard: PermissionGuard
  let reflector: { getAllAndOverride: jest.Mock }
  let permissionService: { canAll: jest.Mock }

  const user: AuthenticatedUser = {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'partner@smartsense.example',
    fullName: 'Partner',
    status: UserStatus.ACTIVE,
    roles: ['Partner'],
    permissions: ['catalog:read'],
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() }
    permissionService = { canAll: jest.fn() }
    guard = new PermissionGuard(
      reflector as unknown as Reflector,
      permissionService as unknown as PermissionService,
    )
  })

  it('allows any request when no @Permissions() metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)
    expect(guard.canActivate(fakeGqlContext(user))).toBe(true)
    expect(permissionService.canAll).not.toHaveBeenCalled()
  })

  it('delegates to PermissionService.canAll with the declared keys', () => {
    reflector.getAllAndOverride.mockReturnValue(['catalog:write'])
    permissionService.canAll.mockReturnValue(true)

    expect(guard.canActivate(fakeGqlContext(user))).toBe(true)
    expect(permissionService.canAll).toHaveBeenCalledWith(user, ['catalog:write'])
  })

  it('throws ForbiddenException when PermissionService denies', () => {
    reflector.getAllAndOverride.mockReturnValue(['catalog:write'])
    permissionService.canAll.mockReturnValue(false)

    expect(() => guard.canActivate(fakeGqlContext(user))).toThrow(ForbiddenException)
  })
})
