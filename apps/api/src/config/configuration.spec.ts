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
