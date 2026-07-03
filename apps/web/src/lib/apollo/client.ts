import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { appConfig } from '@shared/config'

const httpLink = createHttpLink({
  uri: appConfig.graphqlUrl,
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
