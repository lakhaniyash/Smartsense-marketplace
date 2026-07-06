import { type UserStatus } from '@prisma/client'

/**
 * Decoded Keycloak access token claims actually used by the API.
 * `aud` can be a single string or an array per the JWT spec; Keycloak's
 * default audience mapper does not always include this API's client id,
 * so `azp` is checked as a fallback — see JwtStrategy.
 */
export interface KeycloakJwtPayload {
  sub: string
  iss: string
  aud?: string | string[]
  azp?: string
  email?: string
  email_verified?: boolean
  realm_access?: {
    roles: string[]
  }
  exp: number
  iat: number
}

/**
 * Resolved, request-scoped identity attached to `req.user` by JwtStrategy.
 * `roles`/`permissions` are computed fresh per request from Postgres
 * (never trusted from the token) — see AuthService.validateAndProvisionUser.
 */
export interface AuthenticatedUser {
  id: string
  keycloakSubjectId: string
  email: string
  fullName: string
  status: UserStatus
  roles: string[]
  permissions: string[]
  /** Owning Partner, if any — the ownership-scoping key for Partner-reachable data (docs/authorization.md § Ownership Rules). */
  partnerId: string | null
  /** Owning Customer, if any — same role as partnerId for Customer-reachable data. */
  customerId: string | null
}

/** Shape of the Express request once JwtAuthGuard/GqlAuthGuard has run. */
export interface RequestWithUser {
  user: AuthenticatedUser
}
