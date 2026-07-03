import { ForbiddenException, type ExecutionContext } from '@nestjs/common'
import { type Reflector } from '@nestjs/core'
import { UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../types/auth-context.type'
import { RolesGuard } from './roles.guard'

/**
 * Minimal fake satisfying GqlExecutionContext.create(): it reads
 * getType()/getArgs() and reconstructs [root, args, context, info],
 * exposing the "context" (3rd) argument via getContext().req.
 */
function fakeGqlContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getType: () => 'graphql',
    getArgs: () => [undefined, undefined, { req: { user } }, undefined],
    getClass: () => class {},
    getHandler: () => function handler() {},
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: { getAllAndOverride: jest.Mock }

  const adminUser: AuthenticatedUser = {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+admin@smartsensesolutions.com',
    fullName: 'Admin',
    status: UserStatus.ACTIVE,
    roles: ['Admin'],
    permissions: [],
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() }
    guard = new RolesGuard(reflector as unknown as Reflector)
  })

  it('allows any request when no @Roles() metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)
    expect(guard.canActivate(fakeGqlContext(undefined))).toBe(true)
  })

  it('allows a caller holding one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin', 'Partner'])
    expect(guard.canActivate(fakeGqlContext(adminUser))).toBe(true)
  })

  it('throws ForbiddenException when the caller holds none of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Partner'])
    expect(() => guard.canActivate(fakeGqlContext(adminUser))).toThrow(ForbiddenException)
  })
})
