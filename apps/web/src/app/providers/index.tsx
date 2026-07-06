import type { ReactNode } from 'react'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from '@lib/apollo/client'
import { AuthProvider, authService } from '@features/auth'
import { ToastProvider } from '@shared/components'

// Composition-root wiring: features/auth never imports lib/apollo (that
// would reverse the sanctioned lib → features dependency the auth/error
// links rely on), so the cache-reset-on-logout side effect is connected
// here instead, per docs/frontend-architecture.md § Application Lifecycle
// ("Teardown... cache reset is mandatory").
authService.onLogout(() => void apolloClient.clearStore())

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ApolloProvider>
  )
}
