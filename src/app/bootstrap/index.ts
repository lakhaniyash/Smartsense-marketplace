import { appConfig } from '@shared/config'

// Called once at application startup before React mounts.
// Each phase adds its initialization here before the providers layer handles it.
export function bootstrap(): void {
  validateConfig()
  // Phase 3: keycloak silent check-sso (before React render)
  // Phase 4: Apollo Client cache hydration
}

function validateConfig(): void {
  if (!appConfig.graphqlUrl) {
    console.warn('[bootstrap] VITE_GRAPHQL_URL is not set — falling back to /graphql')
  }
  if (!appConfig.keycloak.url) {
    console.warn('[bootstrap] VITE_KEYCLOAK_URL is not set')
  }
}
