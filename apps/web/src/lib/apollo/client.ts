import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
})
