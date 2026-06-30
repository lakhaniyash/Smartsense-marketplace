import type { ReactNode } from 'react'

interface ApolloProviderProps {
  readonly children: ReactNode
}

// Phase 4: Wrap with @apollo/client ApolloProvider, attach auth headers, configure error/retry links
export function ApolloProvider({ children }: ApolloProviderProps) {
  return <>{children}</>
}
