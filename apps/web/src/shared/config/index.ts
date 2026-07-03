export const appConfig = {
  name: 'SmartSense Marketplace',
  version: '0.0.1',
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'smartsense-marketplace',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'smartsense-web',
  },
  auth: {
    silentCheckSsoUrl: import.meta.env.VITE_AUTH_SILENT_CHECK_SSO_URL ?? '/silent-check-sso.html',
    postLogoutRedirectUri:
      import.meta.env.VITE_AUTH_POST_LOGOUT_REDIRECT_URI ?? `${window.location.origin}/login`,
    sessionWarningSeconds: Number(import.meta.env.VITE_AUTH_SESSION_WARNING_SECONDS ?? 60),
  },
} as const
