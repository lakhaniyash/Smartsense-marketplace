import type { ReactNode } from 'react'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from '@lib/apollo/client'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}
