import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Opts a resolver/handler out of the globally-registered GqlAuthGuard.
 * Authentication is opt-out, not opt-in — a new resolver is secure by
 * default unless explicitly marked @Public() (see docs/authentication.md
 * § GraphQL Authentication).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true)
