import * as Joi from 'joi'

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  GRAPHQL_DEBUG: Joi.boolean().default(false),
  GRAPHQL_INTROSPECTION: Joi.boolean().default(true),
  GRAPHQL_PLAYGROUND: Joi.boolean().default(false),
})
