import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { GetCustomerOrdersDocument } from '@lib/graphql/__generated__/graphql'

const ORDER_HISTORY_PAGE_SIZE = 10

// Order History tab — a bounded, paginated preview via the existing
// `orders(filter: { customerId })` query. Deliberately does not import
// anything from @features/orders (features never import each other,
// CLAUDE.md's Architecture Rules); the GraphQL schema itself has no such
// boundary, only the feature's own TS/component code does.
//
// Cursor state is component-local, not URL-backed — unlike the top-level
// Orders list, a page within a detail-page tab isn't something a user
// would bookmark (docs/frontend-architecture.md § State Management
// Strategy). It must still reset when `customerId` changes: react-router
// re-renders CustomerDetailPage in place on a param-only transition (e.g.
// browser back/forward between two previously-visited /customers/:id
// pages) rather than remounting it, so without this a stale cursor from
// customer A would otherwise carry over into customer B's query.
export function useCustomerOrders(customerId: string | undefined) {
  const [after, setAfter] = useState<string | undefined>(undefined)
  const [cursorStack, setCursorStack] = useState<string[]>([])

  useEffect(() => {
    setAfter(undefined)
    setCursorStack([])
  }, [customerId])

  const { data, loading, error, refetch } = useQuery(GetCustomerOrdersDocument, {
    variables: {
      customerId: customerId ?? '',
      first: ORDER_HISTORY_PAGE_SIZE,
      after: after ?? null,
    },
    skip: customerId === undefined,
  })

  function goToNextPage() {
    const endCursor = data?.orders.pageInfo.endCursor
    if (endCursor === undefined || endCursor === null) return
    setCursorStack([...cursorStack, after ?? ''])
    setAfter(endCursor)
  }

  function goToPreviousPage() {
    if (cursorStack.length === 0) {
      setAfter(undefined)
      return
    }
    const previousAfter = cursorStack[cursorStack.length - 1]
    setCursorStack(cursorStack.slice(0, -1))
    setAfter(previousAfter === undefined || previousAfter === '' ? undefined : previousAfter)
  }

  return {
    orders: data?.orders.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.orders.pageInfo,
    isLoading: customerId !== undefined && loading,
    error,
    refetch,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
  }
}
