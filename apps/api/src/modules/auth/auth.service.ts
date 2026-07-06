import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UserStatus, type User } from '@prisma/client'
import { LoggingService } from '../../common/services/logging.service'
import { PrismaService } from '../../prisma/prisma.service'
import { PermissionService } from './permission.service'
import { type AuthenticatedUser, type KeycloakJwtPayload } from './types/auth-context.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
    private readonly logger: LoggingService,
  ) {}

  getStatus(): string {
    return 'auth module initialized'
  }

  /**
   * Runs on every authenticated request (called from JwtStrategy.validate).
   * Resolves the token's `sub` to a Postgres User, syncs Keycloak realm
   * roles into UserRole, and returns the request-scoped AuthenticatedUser
   * attached to `req.user`. See docs/authentication.md § Complete
   * Authentication Flow and § Role Mapping.
   */
  async validateAndProvisionUser(payload: KeycloakJwtPayload): Promise<AuthenticatedUser> {
    const user = await this.resolveUser(payload)

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active')
    }

    await this.syncRoles(user.id, payload.realm_access?.roles ?? [])
    const roles = await this.getRoleNames(user.id)
    const permissions = await this.permissionService.getPermissionKeysForUser(user.id)

    return {
      id: user.id,
      keycloakSubjectId: user.keycloakSubjectId,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles,
      permissions,
      partnerId: user.partnerId,
      customerId: user.customerId,
    }
  }

  /**
   * Looks up the User by keycloakSubjectId (returning user), falling back
   * to email (first real login attaching to a pre-provisioned/seeded
   * "pending" row). Never fabricates a new User from token claims alone —
   * ownerType/partnerId/customerId come from an invite flow this task does
   * not implement, so an identity with no matching row fails closed rather
   * than guessing organization membership (docs/authentication.md's
   * "not derived from the token alone" rule).
   */
  private async resolveUser(payload: KeycloakJwtPayload): Promise<User> {
    const bySubject = await this.prisma.user.findUnique({
      where: { keycloakSubjectId: payload.sub },
    })
    if (bySubject) return bySubject

    if (payload.email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: payload.email } })
      if (byEmail) {
        return this.prisma.user.update({
          where: { id: byEmail.id },
          data: { keycloakSubjectId: payload.sub },
        })
      }
    }

    throw new UnauthorizedException('No account is provisioned for this identity')
  }

  /**
   * Upserts UserRole for every token role that matches a known system Role.
   * Unknown role names are logged and ignored — fail closed, never grant
   * access for a role Postgres doesn't recognize (docs/authentication.md
   * § Role Mapping).
   */
  private async syncRoles(userId: string, tokenRoleNames: string[]): Promise<void> {
    if (tokenRoleNames.length === 0) return

    const knownRoles = await this.prisma.role.findMany({
      where: { name: { in: tokenRoleNames }, isSystemRole: true },
    })

    const unknown = tokenRoleNames.filter((name) => !knownRoles.some((role) => role.name === name))
    for (const name of unknown) {
      this.logger.warn(
        `Ignoring unknown Keycloak role "${name}" (no matching system Role)`,
        AuthService.name,
      )
    }

    for (const role of knownRoles) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id },
        update: {},
      })
    }
  }

  private async getRoleNames(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    })
    return userRoles.map((userRole) => userRole.role.name)
  }
}
