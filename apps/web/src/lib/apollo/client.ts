import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from '@apollo/client'
import { appConfig } from '@shared/config'
import { authLink } from './links/authLink'
import { errorLink } from './links/errorLink'

const httpLink = createHttpLink({
  uri: appConfig.graphqlUrl,
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
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
