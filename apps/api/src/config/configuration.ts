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
      introspection: process.env['GRAPHQL_INTROSPECTION'] !== 'false',
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
    },
  }
}
