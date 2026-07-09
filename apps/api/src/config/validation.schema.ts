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
  KEYCLOAK_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_API_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_API_CLIENT_SECRET: Joi.string().allow('').default(''),
  KEYCLOAK_JWKS_URI: Joi.string().uri().optional(),
  KEYCLOAK_JWKS_CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(600),
  JWT_CLOCK_TOLERANCE_SECONDS: Joi.number().integer().min(0).default(5),
})
