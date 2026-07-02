import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { PassportModule } from '@nestjs/passport'
import { AuthResolver } from './auth.resolver'
import { AuthService } from './auth.service'
import { GqlAuthGuard } from './guards/gql-auth.guard'
import { PermissionGuard } from './guards/permission.guard'
import { RolesGuard } from './guards/roles.guard'
import { PermissionService } from './permission.service'
import { JwtStrategy } from './strategies/jwt.strategy'

/**
 * Home for JWT validation, the global auth/roles/permission guards, and
 * the @Public()/@Roles()/@Permissions()/@CurrentUser() decorators, per
 * docs/authentication.md § Backend Auth Module Responsibilities.
 *
 * Guards are registered globally in this exact order — GqlAuthGuard must
 * run first to populate req.user before RolesGuard/PermissionGuard can
 * read it. Both are no-ops on handlers without @Roles()/@Permissions().
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    AuthResolver,
    AuthService,
    PermissionService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: GqlAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [PermissionService],
})
export class AuthModule {}
