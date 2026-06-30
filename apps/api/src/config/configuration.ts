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
}

export default (): AppConfig => ({
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
})
