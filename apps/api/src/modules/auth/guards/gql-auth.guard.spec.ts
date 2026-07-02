import { type ExecutionContext } from '@nestjs/common'
import { type Reflector } from '@nestjs/core'
import { GqlAuthGuard } from './gql-auth.guard'
import { JwtAuthGuard } from './jwt-auth.guard'

function fakeContext(opts: { type: string; req?: unknown }): ExecutionContext {
  return {
    getType: () => opts.type,
    getArgs: () => [undefined, undefined, { req: opts.req }, undefined],
    getClass: () => class {},
    getHandler: () => function handler() {},
  } as unknown as ExecutionContext
}

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard
  let reflector: { getAllAndOverride: jest.Mock }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() }
    guard = new GqlAuthGuard(reflector as unknown as Reflector)
  })

  it('bypasses non-GraphQL contexts entirely (e.g. the REST /health controller)', () => {
    const superSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate')

    const result = guard.canActivate(fakeContext({ type: 'http' }))

    expect(result).toBe(true)
    expect(superSpy).not.toHaveBeenCalled()
    superSpy.mockRestore()
  })

  it('bypasses authentication for handlers marked @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true)
    const superSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate')

    const result = guard.canActivate(fakeContext({ type: 'graphql' }))

    expect(result).toBe(true)
    expect(superSpy).not.toHaveBeenCalled()
    superSpy.mockRestore()
  })

  it('delegates to the Passport JwtAuthGuard for a non-public GraphQL operation', () => {
    reflector.getAllAndOverride.mockReturnValue(false)
    const superSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockReturnValue(true)

    const context = fakeContext({ type: 'graphql' })
    const result = guard.canActivate(context)

    expect(result).toBe(true)
    expect(superSpy).toHaveBeenCalledWith(context)
    superSpy.mockRestore()
  })

  it('getRequest adapts the GraphQL execution context to the underlying request', () => {
    const req = { user: undefined }
    const context = fakeContext({ type: 'graphql', req })

    expect(guard.getRequest(context)).toBe(req)
  })
})
