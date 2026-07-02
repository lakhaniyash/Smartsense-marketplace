import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'permissions'

/**
 * Declares which `Permission.key` values (e.g. 'catalog:write') a resolver
 * requires — the same vocabulary seeded in Postgres and mirrored by the
 * frontend's canX() helpers (docs/authentication.md § Permission Strategy).
 * Checked by PermissionGuard via PermissionService.can(); a caller must
 * hold every listed key (AND semantics).
 */
export const Permissions = (...keys: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, keys)
