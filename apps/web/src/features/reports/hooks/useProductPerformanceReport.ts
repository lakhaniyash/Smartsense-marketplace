import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  GetProductPerformanceReportDocument,
  ProductPerformanceSortField,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'
import { toDateRangeInput } from '../constants'

function readEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const raw = searchParams.get(key)
  return (allowedValues as readonly string[]).includes(raw ?? '') ? (raw as T) : fallback
}

// Paginated-connection hook shape, cloning useInvoices.ts's cursor-stack
// pattern exactly (M15 plan § Frontend Architecture) — plus the date-range/
// partner scope every report shares. Product Performance's cursor is
// offset-encoded server-side (ProductPerformanceConnectionOutput's doc
// comment), but that's transparent here: the frontend only ever treats
// `after`/`endCursor` as opaque strings, same as every other connection.
export function useProductPerformanceReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const dateRange = toDateRangeInput({ from, to })
  const sortField = readEnumParam(
    searchParams,
    'sortField',
    Object.values(ProductPerformanceSortField),
    ProductPerformanceSortField.Revenue,
  )
  const sortDirection = readEnumParam(
    searchParams,
    'sortDirection',
    Object.values(SortDirection),
    SortDirection.Desc,
  )
  const after = searchParams.get('after') ?? undefined
  const cursorStackParam = searchParams.get('cursorStack')
  const cursorStack = cursorStackParam === null ? [] : cursorStackParam.split(',')

  const { data, loading, error, refetch } = useQuery(GetProductPerformanceReportDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter: {
        ...(partnerId !== undefined && { partnerId }),
        ...(dateRange !== undefined && { dateRange }),
      },
      sort: { field: sortField, direction: sortDirection },
    },
  })

  function setDateRange(range: { from: string | undefined; to: string | undefined }) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after')
      next.delete('cursorStack')
      if (range.from === undefined) next.delete('from')
      else next.set('from', range.from)
      if (range.to === undefined) next.delete('to')
      else next.set('to', range.to)
      return next
    })
  }

  function setPartnerId(value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after')
      next.delete('cursorStack')
      if (value === undefined) next.delete('partnerId')
      else next.set('partnerId', value)
      return next
    })
  }

  function setSort(field: ProductPerformanceSortField, direction: SortDirection) {
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
    const endCursor = data?.productPerformanceReport.pageInfo.endCursor
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
    items: data?.productPerformanceReport.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.productPerformanceReport.pageInfo,
    filters: { partnerId, from, to, sortField, sortDirection },
    isLoading: loading,
    error,
    setDateRange,
    setPartnerId,
    setSort,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
