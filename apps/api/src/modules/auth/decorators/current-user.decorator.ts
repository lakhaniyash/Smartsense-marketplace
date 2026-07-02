import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { type AuthenticatedUser, type RequestWithUser } from '../types/auth-context.type'

/**
 * Extracts the AuthenticatedUser that GqlAuthGuard attached to the request
 * (via JwtStrategy.validate) into a resolver parameter, e.g.:
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 * Only valid on handlers behind GqlAuthGuard — undefined on @Public() routes.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const gqlContext = GqlExecutionContext.create(context)
    const request = gqlContext.getContext<{ req: RequestWithUser }>().req
    return request.user
  },
)
