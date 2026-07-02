import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { type AuthenticatedUser } from './types/auth-context.type'

/**
 * The single place `Permission`/`RolePermission` are queried for
 * authorization purposes (docs/authentication.md § Permission Strategy).
 * Resolution is request-scoped and computed from Postgres, never cached
 * across requests and never trusted from the JWT.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** All effective Permission.key values for a user, via UserRole -> Role -> RolePermission -> Permission. */
  async getPermissionKeysForUser(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    })

    const keys = new Set<string>()
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        keys.add(rolePermission.permission.key)
      }
    }
    return [...keys]
  }

  /** Deny-by-default check against the user's already-resolved permission set. */
  can(user: AuthenticatedUser, permissionKey: string): boolean {
    return user.permissions.includes(permissionKey)
  }

  /** AND semantics: the user must hold every listed key. */
  canAll(user: AuthenticatedUser, permissionKeys: string[]): boolean {
    return permissionKeys.every((key) => this.can(user, key))
  }
}
