import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  type ProductFilterInput,
  GetProductsDocument,
  ProductSortField,
  ProductStatus,
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

// Filters, sort, and pagination cursor are URL-backed (docs/frontend-architecture.md
// § State Management Strategy — "URL-worthy state... if a user would bookmark it, it
// belongs in the URL"). This is the first list feature to establish that pattern in
// code; see docs/milestones.md M12's noted pagination/filter risk.
export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? undefined
  const categoryId = searchParams.get('categoryId') ?? undefined
  const status = readOptionalEnumParam(searchParams, 'status', Object.values(ProductStatus))
  const sortField = readEnumParam(
    searchParams,
    'sortField',
    Object.values(ProductSortField),
    ProductSortField.CreatedAt,
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

  const filter: ProductFilterInput = {}
  if (search !== undefined) filter.search = search
  if (categoryId !== undefined) filter.categoryId = categoryId
  if (status !== undefined) filter.status = status

  const { data, loading, error, refetch } = useQuery(GetProductsDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter,
      sort: { field: sortField, direction: sortDirection },
    },
  })

  function setFilter(key: 'search' | 'categoryId' | 'status', value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after') // filter changes always restart pagination
      next.delete('cursorStack')
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, value)
      return next
    })
  }

  function setSort(field: ProductSortField, direction: SortDirection) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after')
      next.delete('cursorStack')
      next.set('sortField', field)
      next.set('sortDirection', direction)
      return next
    })
  }

  function goToNextPage() {
    const endCursor = data?.products.pageInfo.endCursor
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
    products: data?.products.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.products.pageInfo,
    filters: { search, categoryId, status, sortField, sortDirection },
    isLoading: loading,
    error,
    setFilter,
    setSort,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
