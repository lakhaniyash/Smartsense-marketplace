import { Injectable, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { JwtAuthGuard } from './jwt-auth.guard'

/**
 * Registered globally as APP_GUARD (see AuthModule) so every GraphQL
 * operation is authenticated by default — opt-out via @Public(), never
 * opt-in (docs/authentication.md § GraphQL Authentication: "a new resolver
 * is secure by default, not insecure until someone remembers to guard it").
 * Adapts AuthGuard('jwt') to the GraphQL execution context, since Passport
 * guards read the request via context.switchToHttp() by default.
 *
 * Enforcement is schema-level only, not blanket HTTP middleware (same
 * section) — plain REST controllers like /health bypass this guard
 * entirely, since GqlExecutionContext can't safely inspect a non-GraphQL
 * request.
 */
@Injectable()
export class GqlAuthGuard extends JwtAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  override canActivate(context: ExecutionContext): ReturnType<JwtAuthGuard['canActivate']> {
    if (context.getType<GqlContextType>() !== 'graphql') return true

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    return super.canActivate(context)
  }

  override getRequest(context: ExecutionContext): unknown {
    const gqlContext = GqlExecutionContext.create(context)
    return gqlContext.getContext<{ req: unknown }>().req
  }
}
