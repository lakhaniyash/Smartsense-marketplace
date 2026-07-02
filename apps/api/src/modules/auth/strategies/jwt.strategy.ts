import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { passportJwtSecret } from 'jwks-rsa'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { type AppConfig } from '../../../config/configuration'
import { AuthService } from '../auth.service'
import { type AuthenticatedUser, type KeycloakJwtPayload } from '../types/auth-context.type'

/**
 * Verifies signature (RS256 via Keycloak's JWKS, cached by kid), issuer,
 * and expiration on every request (passport-jwt/jwks-rsa handle these
 * three natively). Audience is checked manually in `validate()` below
 * because Keycloak puts the requesting client in `aud` only if an
 * audience mapper is configured — see docs/authentication.md's claims
 * table ("aud / azp Must include/equal ... smartsense-api").
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly audience: string

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const keycloak = configService.getOrThrow<AppConfig['keycloak']>('keycloak')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: keycloak.issuer,
      // clockTolerance isn't in @types/passport-jwt's typed options, but the
      // deprecated jsonWebTokenOptions passthrough forwards it to
      // jsonwebtoken.verify() correctly.
      jsonWebTokenOptions: { clockTolerance: keycloak.clockToleranceSeconds },
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        cacheMaxAge: keycloak.jwksCacheTtlSeconds * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: keycloak.jwksUri,
      }),
    })

    this.audience = keycloak.apiClientId
  }

  /**
   * Runs after passport-jwt has already verified signature, `exp`, and
   * `iss`. Checks `aud`/`azp` for this API's client id, then delegates to
   * AuthService for user resolution/provisioning and role sync.
   */
  async validate(payload: KeycloakJwtPayload): Promise<AuthenticatedUser> {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean)
    const audienceMatches = audiences.includes(this.audience) || payload.azp === this.audience

    if (!audienceMatches) {
      throw new UnauthorizedException('Token audience does not match this API')
    }

    return this.authService.validateAndProvisionUser(payload)
  }
}
