import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * Declares which Postgres `Role.name` values (e.g. 'Admin', 'Partner') may
 * access a resolver/field. Checked by RolesGuard against the caller's
 * resolved roles. A handler with no @Roles() is unrestricted by role
 * (still subject to authentication via the global GqlAuthGuard).
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles)
