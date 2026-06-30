import { AppRouter } from '@app/router'
import { ThemeProvider } from './ThemeProvider'

// Provider order matters: ThemeProvider wraps all; ApolloProvider and AuthProvider
// are added inside ThemeProvider once implemented (Phases 3 & 4).
export function AppProviders() {
  return (
    <ThemeProvider>
      {/* ApolloProvider — Phase 4: wrap with configured Apollo client */}
      {/* AuthProvider — Phase 3: initialize Keycloak, expose auth context */}
      <AppRouter />
    </ThemeProvider>
  )
}
