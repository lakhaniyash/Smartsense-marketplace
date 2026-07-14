import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  GetUsersDocument,
  SortDirection,
  type UserFilterInput,
  UserOwnerType,
  UserSortField,
  UserStatus,
} from '@lib/graphql/__generated__/graphql'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'

function readOptionalEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
): T | undefined {
  const raw = searchParams.get(key)
  return raw !== null && (allowedValues as readonly string[]).includes(raw) ? (raw as T) : undefined
}

// Filters, sort, and pagination cursor are URL-backed
// (docs/frontend-architecture.md § State Management Strategy), same pattern as
// useCustomers/useOrders.
export function useUsers() {
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? undefined
  const status = readOptionalEnumParam(searchParams, 'status', Object.values(UserStatus))
  const ownerType = readOptionalEnumParam(searchParams, 'ownerType', Object.values(UserOwnerType))
  const after = searchParams.get('after') ?? undefined
  // Client-side cursor stack for "Previous" — never the browser's history
  // (standing project convention), same as useCustomers.
  const cursorStackParam = searchParams.get('cursorStack')
  const cursorStack = cursorStackParam === null ? [] : cursorStackParam.split(',')

  const filter: UserFilterInput = {}
  if (search !== undefined) filter.search = search
  if (status !== undefined) filter.status = status
  if (ownerType !== undefined) filter.ownerType = ownerType

  const { data, loading, error, refetch } = useQuery(GetUsersDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter,
      sort: { field: UserSortField.FullName, direction: SortDirection.Asc },
    },
  })

  function setFilter(key: 'search' | 'status' | 'ownerType', value: string | undefined) {
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
    const endCursor = data?.users.pageInfo.endCursor
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
    users: data?.users.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.users.pageInfo,
    filters: { search, status, ownerType },
    isLoading: loading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
