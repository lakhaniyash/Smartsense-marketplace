import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  type OrderFilterInput,
  GetOrdersDocument,
  OrderSortField,
  OrderStatus,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'

function readEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const raw = searchParams.get(key)
  return (allowedValues as readonly string[]).includes(raw ?? '') ? (raw as T) : fallback
}

function readOptionalEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
): T | undefined {
  const raw = searchParams.get(key)
  return raw !== null && (allowedValues as readonly string[]).includes(raw) ? (raw as T) : undefined
}

// URL-backed filter/sort/cursor state, same pattern as useCatalog
// (docs/frontend-architecture.md § State Management Strategy).
export function useOrders() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = readOptionalEnumParam(searchParams, 'status', Object.values(OrderStatus))
  const sortField = readEnumParam(
    searchParams,
    'sortField',
    Object.values(OrderSortField),
    OrderSortField.CreatedAt,
  )
  const sortDirection = readEnumParam(
    searchParams,
    'sortDirection',
    Object.values(SortDirection),
    SortDirection.Desc,
  )
  const after = searchParams.get('after') ?? undefined
  // The backend only implements forward pagination (first/after) — no
  // before/last (docs/graphql.md). "Previous" is therefore a client-side
  // stack of the `after` values passed through to reach the current page
  // (an empty-string entry means "that page had no cursor, i.e. page one"),
  // popped on the way back — never the browser's history, which breaks the
  // moment a filter change or a bookmarked/shared URL is involved.
  const cursorStackParam = searchParams.get('cursorStack')
  const cursorStack = cursorStackParam === null ? [] : cursorStackParam.split(',')

  const filter: OrderFilterInput = {}
  if (status !== undefined) filter.status = status

  const { data, loading, error, refetch } = useQuery(GetOrdersDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter,
      sort: { field: sortField, direction: sortDirection },
    },
  })

  function setFilter(key: 'status', value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after')
      next.delete('cursorStack')
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, value)
      return next
    })
  }

  function goToNextPage() {
    const endCursor = data?.orders.pageInfo.endCursor
    if (endCursor === undefined || endCursor === null) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('cursorStack', [...cursorStack, after ?? ''].join(','))
      next.set('after', endCursor)
      return next
    })
  }

  function goToPreviousPage() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (cursorStack.length === 0) {
        // No tracked history (e.g. a bookmarked/shared URL that already
        // had a cursor in it) — the honest fallback is page one, not
        // whatever page the browser's history happens to hold.
        next.delete('after')
        next.delete('cursorStack')
        return next
      }
      const previousAfter = cursorStack[cursorStack.length - 1]
      const remainingStack = cursorStack.slice(0, -1)
      if (remainingStack.length === 0) next.delete('cursorStack')
      else next.set('cursorStack', remainingStack.join(','))
      if (previousAfter === undefined || previousAfter === '') next.delete('after')
      else next.set('after', previousAfter)
      return next
    })
  }

  return {
    orders: data?.orders.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.orders.pageInfo,
    filters: { status, sortField, sortDirection },
    isLoading: loading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
