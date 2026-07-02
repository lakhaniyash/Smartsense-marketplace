import { UnauthorizedException } from '@nestjs/common'
import { type ConfigService } from '@nestjs/config'
import { UserStatus } from '@prisma/client'
import { type AuthService } from '../auth.service'
import { type KeycloakJwtPayload } from '../types/auth-context.type'
import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy
  let authService: { validateAndProvisionUser: jest.Mock }

  const keycloakConfig = {
    url: 'http://localhost:8080',
    realm: 'smartsense-marketplace',
    apiClientId: 'smartsense-api',
    apiClientSecret: '',
    issuer: 'http://localhost:8080/realms/smartsense-marketplace',
    jwksUri: 'http://localhost:8080/realms/smartsense-marketplace/protocol/openid-connect/certs',
    jwksCacheTtlSeconds: 600,
    clockToleranceSeconds: 5,
  }

  const basePayload: KeycloakJwtPayload = {
    sub: 'kc-sub-1',
    iss: keycloakConfig.issuer,
    exp: Math.floor(Date.now() / 1000) + 900,
    iat: Math.floor(Date.now() / 1000),
  }

  const resolvedUser = {
    id: 'user-1',
    keycloakSubjectId: 'kc-sub-1',
    email: 'a@b.com',
    fullName: 'A B',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: [],
  }

  beforeEach(() => {
    const configService = { getOrThrow: jest.fn().mockReturnValue(keycloakConfig) }
    authService = { validateAndProvisionUser: jest.fn().mockResolvedValue(resolvedUser) }

    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      authService as unknown as AuthService,
    )
  })

  it('accepts a token whose aud array includes this API client id', async () => {
    const result = await strategy.validate({ ...basePayload, aud: ['smartsense-api', 'account'] })
    expect(result).toBe(resolvedUser)
    expect(authService.validateAndProvisionUser).toHaveBeenCalledTimes(1)
  })

  it('accepts a token whose aud is a single matching string', async () => {
    await strategy.validate({ ...basePayload, aud: 'smartsense-api' })
    expect(authService.validateAndProvisionUser).toHaveBeenCalledTimes(1)
  })

  it('accepts a token with no matching aud but a matching azp', async () => {
    await strategy.validate({ ...basePayload, aud: 'account', azp: 'smartsense-api' })
    expect(authService.validateAndProvisionUser).toHaveBeenCalledTimes(1)
  })

  it('rejects a token whose aud and azp both fail to match this API', async () => {
    await expect(
      strategy.validate({ ...basePayload, aud: 'account', azp: 'smartsense-web' }),
    ).rejects.toThrow(UnauthorizedException)
    expect(authService.validateAndProvisionUser).not.toHaveBeenCalled()
  })

  it('rejects a token with neither aud nor azp present', async () => {
    await expect(strategy.validate({ ...basePayload })).rejects.toThrow(UnauthorizedException)
  })
})
