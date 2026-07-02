import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { PermissionService } from '../permission.service'
import { type RequestWithUser } from '../types/auth-context.type'

/**
 * Registered globally (see AuthModule) but a no-op unless a handler
 * declares @Permissions(...) — runs after GqlAuthGuard. Deny-by-default:
 * a caller must hold every declared Permission.key (AND semantics), per
 * docs/authentication.md § Permission Strategy.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredPermissions || requiredPermissions.length === 0) return true

    const gqlContext = GqlExecutionContext.create(context)
    const { user } = gqlContext.getContext<{ req: RequestWithUser }>().req

    if (!this.permissionService.canAll(user, requiredPermissions)) {
      throw new ForbiddenException(`Requires permission(s): ${requiredPermissions.join(', ')}`)
    }
    return true
  }
}
