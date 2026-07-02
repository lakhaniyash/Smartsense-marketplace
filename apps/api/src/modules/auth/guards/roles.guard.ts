import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { type RequestWithUser } from '../types/auth-context.type'

/**
 * Registered globally (see AuthModule) but a no-op unless a handler
 * declares @Roles(...) — runs after GqlAuthGuard, so `req.user` is always
 * populated by the time this checks it.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const gqlContext = GqlExecutionContext.create(context)
    const { user } = gqlContext.getContext<{ req: RequestWithUser }>().req

    const hasRole = requiredRoles.some((role) => user.roles.includes(role))
    if (!hasRole) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`)
    }
    return true
  }
}
