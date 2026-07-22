import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { PassportModule } from '@nestjs/passport'
import { AuthResolver } from './auth.resolver'
import { AuthService } from './auth.service'
import { GqlAuthGuard } from './guards/gql-auth.guard'
import { PermissionGuard } from './guards/permission.guard'
import { PermissionService } from './permission.service'
import { JwtStrategy } from './strategies/jwt.strategy'

/**
 * Home for JWT validation, the global auth/permission guards, and the
 * @Public()/@Permissions()/@CurrentUser() decorators, per
 * docs/authentication.md § Backend Auth Module Responsibilities.
 *
 * Guards are registered globally in this exact order — GqlAuthGuard must
 * run first to populate req.user before PermissionGuard can read it.
 * PermissionGuard is a no-op on handlers without @Permissions().
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    AuthResolver,
    AuthService,
    PermissionService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: GqlAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [PermissionService],
})
export class AuthModule {}
