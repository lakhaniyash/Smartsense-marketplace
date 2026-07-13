import { useQuery } from '@apollo/client'
import { GetCustomerOrdersDocument } from '@lib/graphql/__generated__/graphql'

const ORDER_HISTORY_PAGE_SIZE = 10

// Order History tab — a bounded recent-orders preview via the existing
// `orders(filter: { customerId })` query. Deliberately does not import
// anything from @features/orders (features never import each other,
// CLAUDE.md's Architecture Rules); the GraphQL schema itself has no such
// boundary, only the feature's own TS/component code does.
export function useCustomerOrders(customerId: string | undefined) {
  const { data, loading, error } = useQuery(GetCustomerOrdersDocument, {
    variables: { customerId: customerId ?? '', first: ORDER_HISTORY_PAGE_SIZE },
    skip: customerId === undefined,
  })

  return {
    orders: data?.orders.edges.map((edge) => edge.node) ?? [],
    isLoading: customerId !== undefined && loading,
    error,
  }
}
