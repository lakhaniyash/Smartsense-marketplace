import configuration from './configuration'

describe('configuration — graphql.introspection', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('defaults off in production when unset', () => {
    process.env['NODE_ENV'] = 'production'
    delete process.env['GRAPHQL_INTROSPECTION']

    expect(configuration().graphql.introspection).toBe(false)
  })

  it('defaults on in development when unset', () => {
    process.env['NODE_ENV'] = 'development'
    delete process.env['GRAPHQL_INTROSPECTION']

    expect(configuration().graphql.introspection).toBe(true)
  })

  it('an explicit true wins even in production', () => {
    process.env['NODE_ENV'] = 'production'
    process.env['GRAPHQL_INTROSPECTION'] = 'true'

    expect(configuration().graphql.introspection).toBe(true)
  })

  it('an explicit false wins even outside production', () => {
    process.env['NODE_ENV'] = 'development'
    process.env['GRAPHQL_INTROSPECTION'] = 'false'

    expect(configuration().graphql.introspection).toBe(false)
  })
})

describe('configuration — keycloak.issuer', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('derives the issuer from KEYCLOAK_URL when KEYCLOAK_ISSUER is unset', () => {
    process.env['KEYCLOAK_URL'] = 'http://keycloak:8080'
    process.env['KEYCLOAK_REALM'] = 'smartsense-marketplace'
    delete process.env['KEYCLOAK_ISSUER']

    expect(configuration().keycloak.issuer).toBe('http://keycloak:8080/realms/smartsense-marketplace')
  })

  it('uses KEYCLOAK_ISSUER for the issuer when set, independent of KEYCLOAK_URL', () => {
    // The Docker Compose shape this override exists for: KEYCLOAK_URL stays
    // container-reachable (JWKS fetch, Admin API) while KEYCLOAK_ISSUER
    // matches the browser-facing hostname tokens are actually issued
    // against — the two must be able to differ.
    process.env['KEYCLOAK_URL'] = 'http://keycloak:8080'
    process.env['KEYCLOAK_ISSUER'] = 'http://localhost:8080'
    process.env['KEYCLOAK_REALM'] = 'smartsense-marketplace'

    const config = configuration()
    expect(config.keycloak.issuer).toBe('http://localhost:8080/realms/smartsense-marketplace')
    expect(config.keycloak.url).toBe('http://keycloak:8080')
  })

  it('derives jwksUri default from the issuer, so an issuer override alone would misdirect JWKS fetch without an explicit KEYCLOAK_JWKS_URI', () => {
    process.env['KEYCLOAK_URL'] = 'http://keycloak:8080'
    process.env['KEYCLOAK_ISSUER'] = 'http://localhost:8080'
    process.env['KEYCLOAK_REALM'] = 'smartsense-marketplace'
    delete process.env['KEYCLOAK_JWKS_URI']

    expect(configuration().keycloak.jwksUri).toBe(
      'http://localhost:8080/realms/smartsense-marketplace/protocol/openid-connect/certs',
    )
  })
})
