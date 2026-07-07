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
      next.set('after', endCursor)
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
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
