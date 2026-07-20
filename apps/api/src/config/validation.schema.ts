import * as Joi from 'joi'

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  GRAPHQL_DEBUG: Joi.boolean().default(false),
  // Matches configuration.ts's fail-closed default: off in production
  // unless explicitly overridden, on everywhere else.
  GRAPHQL_INTROSPECTION: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),
  GRAPHQL_PLAYGROUND: Joi.boolean().default(false),
  // Comma-separated browser origin allowlist (SM-269). Optional — empty means
  // permissive CORS (dev); production sets it to the web origin(s).
  CORS_ALLOWED_ORIGINS: Joi.string().allow('').default(''),
  // Container-reachable base URL — used for JWKS fetch and the Keycloak
  // Admin API (KeycloakAdminService), both called from inside the API
  // process. In a topology where the API reaches Keycloak by a different
  // hostname than the browser does (e.g. Docker Compose: the API uses the
  // service name `keycloak`, the browser uses `localhost`), this is NOT the
  // hostname that ends up in an issued token's `iss` claim — see
  // KEYCLOAK_ISSUER below.
  KEYCLOAK_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_API_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_API_CLIENT_SECRET: Joi.string().allow('').default(''),
  KEYCLOAK_JWKS_URI: Joi.string().uri().optional(),
  // Browser-facing base URL for constructing the expected `iss` — optional,
  // defaults to KEYCLOAK_URL (correct whenever the API and the browser reach
  // Keycloak through the same hostname, e.g. `npm run dev`). Set this
  // separately whenever they differ, e.g. Docker Compose's full stack, where
  // KEYCLOAK_URL must stay the container-reachable `http://keycloak:8080`
  // but issued tokens carry `iss` based on the browser-facing
  // `http://localhost:8080` — without this override, every authenticated
  // request fails closed with UNAUTHENTICATED on an issuer mismatch.
  KEYCLOAK_ISSUER: Joi.string().uri().optional(),
  KEYCLOAK_JWKS_CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(600),
  JWT_CLOCK_TOLERANCE_SECONDS: Joi.number().integer().min(0).default(5),
  // Optional — see configuration.ts's identical comment on why this doesn't
  // gate app boot the way KEYCLOAK_API_CLIENT_ID does.
  KEYCLOAK_ADMIN_CLIENT_ID: Joi.string().allow('').default(''),
  KEYCLOAK_ADMIN_CLIENT_SECRET: Joi.string().allow('').default(''),
})
