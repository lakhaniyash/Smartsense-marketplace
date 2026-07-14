export interface AppConfig {
  port: number
  nodeEnv: string
  database: {
    url: string
  }
  graphql: {
    debug: boolean
    introspection: boolean
    playground: boolean
  }
  keycloak: {
    url: string
    realm: string
    apiClientId: string
    apiClientSecret: string
    issuer: string
    jwksUri: string
    jwksCacheTtlSeconds: number
    clockToleranceSeconds: number
    adminClientId: string
    adminClientSecret: string
  }
}

export default (): AppConfig => {
  const keycloakUrl = process.env['KEYCLOAK_URL'] ?? ''
  const keycloakRealm = process.env['KEYCLOAK_REALM'] ?? ''
  const issuer = `${keycloakUrl}/realms/${keycloakRealm}`

  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    database: {
      url: process.env['DATABASE_URL'] ?? '',
    },
    graphql: {
      debug: process.env['GRAPHQL_DEBUG'] === 'true',
      // Fail closed in production: introspection exposes the full schema
      // (every field, every description) to anyone who can reach the
      // endpoint, so an unset env var must default off there, not on —
      // only a non-production environment defaults it on for developer
      // convenience. An explicit GRAPHQL_INTROSPECTION always wins.
      introspection:
        process.env['GRAPHQL_INTROSPECTION'] === undefined
          ? process.env['NODE_ENV'] !== 'production'
          : process.env['GRAPHQL_INTROSPECTION'] === 'true',
      playground: process.env['GRAPHQL_PLAYGROUND'] === 'true',
    },
    keycloak: {
      url: keycloakUrl,
      realm: keycloakRealm,
      apiClientId: process.env['KEYCLOAK_API_CLIENT_ID'] ?? '',
      apiClientSecret: process.env['KEYCLOAK_API_CLIENT_SECRET'] ?? '',
      issuer,
      jwksUri: process.env['KEYCLOAK_JWKS_URI'] ?? `${issuer}/protocol/openid-connect/certs`,
      jwksCacheTtlSeconds: parseInt(process.env['KEYCLOAK_JWKS_CACHE_TTL_SECONDS'] ?? '600', 10),
      clockToleranceSeconds: parseInt(process.env['JWT_CLOCK_TOLERANCE_SECONDS'] ?? '5', 10),
      // Optional, unlike apiClientId/apiClientSecret above — KeycloakAdminService
      // fails closed at the call site (not at boot) when these are absent, since
      // gating the whole app's startup on credentials only the invite/password-reset
      // mutations need would break every environment that hasn't configured them yet.
      adminClientId: process.env['KEYCLOAK_ADMIN_CLIENT_ID'] ?? '',
      adminClientSecret: process.env['KEYCLOAK_ADMIN_CLIENT_SECRET'] ?? '',
    },
  }
}
