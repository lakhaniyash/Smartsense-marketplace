import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type AppConfig } from '../../config/configuration'

export interface CreateKeycloakUserInput {
  email: string
  firstName: string
  lastName: string
  requiredActions: string[]
}

/**
 * The only caller of Keycloak's Admin REST API in this codebase (SM-336) —
 * every other Keycloak interaction is login/token validation (JwtStrategy,
 * AuthService). Backs the Users module's invite (SM-337) and password-reset
 * (SM-338) mutations, neither of which exists yet on this branch.
 *
 * Fails closed at the call site, not at app boot: `adminClientId`/
 * `adminClientSecret` are optional config (configuration.ts's own comment)
 * so an environment that hasn't provisioned the `smartsense-api-admin`
 * service-account client yet still starts normally — it just can't invite
 * users or trigger password resets until configured.
 */
@Injectable()
export class KeycloakAdminService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Idempotent on `email` (SM-337): Keycloak answers a duplicate-username/
   * email create with `409 Conflict`, and we treat that as success by
   * looking the existing identity up and returning its id — so a retry of
   * the invite flow after a partial failure (Keycloak user created, but the
   * local DB transaction then rolled back) re-attaches to the same Keycloak
   * user instead of erroring or double-provisioning. This is the invite's
   * equivalent of Billing's idempotency-key replay (docs/api-conventions.md
   * § Idempotency); `email` is the natural key since it is `@unique` on both
   * the Keycloak user and the local `User` row.
   */
  async createUser(input: CreateKeycloakUserInput): Promise<string> {
    const keycloak = this.configService.getOrThrow<AppConfig['keycloak']>('keycloak')
    const token = await this.getAccessToken(keycloak)

    const response = await fetch(`${keycloak.url}/admin/realms/${keycloak.realm}/users`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        username: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        enabled: true,
        emailVerified: false,
        requiredActions: input.requiredActions,
      }),
    })

    if (response.status === 409) {
      return this.findUserIdByEmail(keycloak, token, input.email)
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to create the Keycloak user (${response.status})`,
      )
    }

    // Keycloak's create-user response carries no body — the new user's id
    // is only in the Location response header (.../users/<id>).
    const location = response.headers.get('location')
    const keycloakSubjectId = location?.split('/').pop()
    if (keycloakSubjectId === undefined || keycloakSubjectId === '') {
      throw new InternalServerErrorException("Keycloak did not return the created user's id")
    }
    return keycloakSubjectId
  }

  /**
   * Resolves an existing Keycloak user's id from their email — only reached
   * on the 409 idempotency path above, where the create told us a user with
   * this email already exists. `exact=true` avoids Keycloak's default
   * substring matching so we can't attach to the wrong identity.
   */
  private async findUserIdByEmail(
    keycloak: AppConfig['keycloak'],
    token: string,
    email: string,
  ): Promise<string> {
    const query = new URLSearchParams({ email, exact: 'true' })
    const response = await fetch(
      `${keycloak.url}/admin/realms/${keycloak.realm}/users?${query.toString()}`,
      { headers: { authorization: `Bearer ${token}` } },
    )

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to look up the existing Keycloak user (${response.status})`,
      )
    }

    const users = (await response.json()) as Array<{ id: string }>
    const existingId = users[0]?.id
    if (existingId === undefined || existingId === '') {
      throw new InternalServerErrorException(
        'Keycloak reported a conflicting user but returned none on lookup',
      )
    }
    return existingId
  }

  /**
   * Triggers Keycloak's own hosted email flow for the given required
   * action(s) — e.g. `['UPDATE_PASSWORD']` for a password reset, or
   * `['UPDATE_PASSWORD', 'VERIFY_EMAIL']` at invite time. No password value
   * ever transits this application (docs/security.md: "the application
   * never sees, stores, or validates a password").
   */
  async sendExecuteActionsEmail(keycloakSubjectId: string, actions: string[]): Promise<void> {
    const keycloak = this.configService.getOrThrow<AppConfig['keycloak']>('keycloak')
    const token = await this.getAccessToken(keycloak)

    const response = await fetch(
      `${keycloak.url}/admin/realms/${keycloak.realm}/users/${keycloakSubjectId}/execute-actions-email`,
      {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(actions),
      },
    )

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to trigger the Keycloak execute-actions email (${response.status})`,
      )
    }
  }

  private async getAccessToken(keycloak: AppConfig['keycloak']): Promise<string> {
    if (keycloak.adminClientId === '' || keycloak.adminClientSecret === '') {
      throw new InternalServerErrorException(
        'Keycloak Admin API is not configured ' +
          '(KEYCLOAK_ADMIN_CLIENT_ID/KEYCLOAK_ADMIN_CLIENT_SECRET)',
      )
    }

    const response = await fetch(
      `${keycloak.url}/realms/${keycloak.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: keycloak.adminClientId,
          client_secret: keycloak.adminClientSecret,
        }),
      },
    )

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to authenticate with the Keycloak Admin API')
    }

    const data = (await response.json()) as { access_token: string }
    return data.access_token
  }
}
