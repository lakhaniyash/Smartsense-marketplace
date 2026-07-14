import { InternalServerErrorException } from '@nestjs/common'
import { type ConfigService } from '@nestjs/config'
import { type AppConfig } from '../../config/configuration'
import { KeycloakAdminService } from './keycloak-admin.service'

function keycloakConfig(overrides: Partial<AppConfig['keycloak']> = {}): AppConfig['keycloak'] {
  return {
    url: 'http://localhost:8080',
    realm: 'smartsense-marketplace',
    apiClientId: 'smartsense-api',
    apiClientSecret: 'api-secret',
    issuer: 'http://localhost:8080/realms/smartsense-marketplace',
    jwksUri: 'http://localhost:8080/realms/smartsense-marketplace/protocol/openid-connect/certs',
    jwksCacheTtlSeconds: 600,
    clockToleranceSeconds: 5,
    adminClientId: 'smartsense-api-admin',
    adminClientSecret: 'admin-secret',
    ...overrides,
  }
}

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers: { get: (name: string) => init.headers?.[name.toLowerCase()] ?? null },
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('KeycloakAdminService', () => {
  let service: KeycloakAdminService
  let configService: { getOrThrow: jest.Mock }
  let fetchMock: jest.Mock

  beforeEach(() => {
    configService = { getOrThrow: jest.fn().mockReturnValue(keycloakConfig()) }
    service = new KeycloakAdminService(configService as unknown as ConfigService)
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  describe('credential guard', () => {
    it('fails closed without calling fetch when adminClientId is empty', async () => {
      configService.getOrThrow.mockReturnValue(keycloakConfig({ adminClientId: '' }))

      await expect(
        service.createUser({
          email: 'yash.lakhani+invitee@smartsensesolutions.com',
          firstName: 'Jordan',
          lastName: 'Rivera',
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      ).rejects.toThrow(InternalServerErrorException)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails closed without calling fetch when adminClientSecret is empty', async () => {
      configService.getOrThrow.mockReturnValue(keycloakConfig({ adminClientSecret: '' }))

      await expect(
        service.sendExecuteActionsEmail('kc-sub-1', ['UPDATE_PASSWORD']),
      ).rejects.toThrow(InternalServerErrorException)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('token acquisition', () => {
    it('throws when the token endpoint rejects the client credentials', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_client' }, { status: 401 }))

      await expect(
        service.createUser({
          email: 'yash.lakhani+invitee@smartsensesolutions.com',
          firstName: 'Jordan',
          lastName: 'Rivera',
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      ).rejects.toThrow(InternalServerErrorException)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('requests a client_credentials grant with the admin client id/secret', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse(null, { status: 204 }))

      await service.sendExecuteActionsEmail('kc-sub-1', ['UPDATE_PASSWORD'])

      const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(tokenUrl).toBe(
        'http://localhost:8080/realms/smartsense-marketplace/protocol/openid-connect/token',
      )
      const body = tokenInit.body as URLSearchParams
      expect(body.get('grant_type')).toBe('client_credentials')
      expect(body.get('client_id')).toBe('smartsense-api-admin')
      expect(body.get('client_secret')).toBe('admin-secret')
    })
  })

  describe('createUser', () => {
    it('extracts the new user id from the Location response header', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(
          jsonResponse(null, {
            status: 201,
            headers: {
              location:
                'http://localhost:8080/admin/realms/smartsense-marketplace/users/kc-sub-new-1',
            },
          }),
        )

      const result = await service.createUser({
        email: 'yash.lakhani+invitee@smartsensesolutions.com',
        firstName: 'Jordan',
        lastName: 'Rivera',
        requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
      })

      expect(result).toBe('kc-sub-new-1')
      const [, createInit] = fetchMock.mock.calls[1] as [string, RequestInit]
      const payload = JSON.parse(createInit.body as string) as Record<string, unknown>
      expect(payload).toMatchObject({
        email: 'yash.lakhani+invitee@smartsensesolutions.com',
        username: 'yash.lakhani+invitee@smartsensesolutions.com',
        requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
      })
    })

    it('throws when Keycloak rejects the create-user call', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse({ error: 'bad_request' }, { status: 400 }))

      await expect(
        service.createUser({
          email: 'yash.lakhani+invitee@smartsensesolutions.com',
          firstName: 'Jordan',
          lastName: 'Rivera',
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      ).rejects.toThrow(InternalServerErrorException)
    })

    it('is idempotent on email: a 409 conflict reuses the existing user id', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse({ error: 'conflict' }, { status: 409 }))
        .mockResolvedValueOnce(jsonResponse([{ id: 'kc-existing-1' }]))

      const result = await service.createUser({
        email: 'yash.lakhani+invitee@smartsensesolutions.com',
        firstName: 'Jordan',
        lastName: 'Rivera',
        requiredActions: ['UPDATE_PASSWORD'],
      })

      expect(result).toBe('kc-existing-1')
      const [lookupUrl] = fetchMock.mock.calls[2] as [string, RequestInit]
      expect(lookupUrl).toBe(
        'http://localhost:8080/admin/realms/smartsense-marketplace/users?' +
          'email=yash.lakhani%2Binvitee%40smartsensesolutions.com&exact=true',
      )
    })

    it('throws when a 409 lookup returns no matching user', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse({ error: 'conflict' }, { status: 409 }))
        .mockResolvedValueOnce(jsonResponse([]))

      await expect(
        service.createUser({
          email: 'yash.lakhani+invitee@smartsensesolutions.com',
          firstName: 'Jordan',
          lastName: 'Rivera',
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      ).rejects.toThrow(InternalServerErrorException)
    })

    it('throws when Keycloak omits the Location header', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse(null, { status: 201 }))

      await expect(
        service.createUser({
          email: 'yash.lakhani+invitee@smartsensesolutions.com',
          firstName: 'Jordan',
          lastName: 'Rivera',
          requiredActions: ['UPDATE_PASSWORD'],
        }),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('sendExecuteActionsEmail', () => {
    it('PUTs the requested actions to the execute-actions-email endpoint', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse(null, { status: 204 }))

      await service.sendExecuteActionsEmail('kc-sub-1', ['UPDATE_PASSWORD'])

      const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
      expect(url).toBe(
        'http://localhost:8080/admin/realms/smartsense-marketplace/users/kc-sub-1/execute-actions-email',
      )
      expect(init.method).toBe('PUT')
      expect(JSON.parse(init.body as string)).toEqual(['UPDATE_PASSWORD'])
    })

    it('throws when Keycloak rejects the request', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1' }))
        .mockResolvedValueOnce(jsonResponse({ error: 'not_found' }, { status: 404 }))

      await expect(
        service.sendExecuteActionsEmail('kc-sub-1', ['UPDATE_PASSWORD']),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })
})
