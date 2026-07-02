import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Generic Passport JWT guard — verifies the request via JwtStrategy and
 * populates `req.user`. Works for any HTTP execution context. GraphQL
 * resolvers use GqlAuthGuard instead, which adapts the execution context
 * and adds the @Public() bypass.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
