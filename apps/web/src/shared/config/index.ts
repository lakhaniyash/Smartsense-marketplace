export const appConfig = {
  name: 'SmartSense Marketplace',
  version: '0.0.1',
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'smartsense-marketplace',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'smartsense-web',
  },
} as const
