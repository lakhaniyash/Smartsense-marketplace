import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  BillingReportSortField,
  BillingReportStatus,
  GetBillingReportsDocument,
  SortDirection,
  type BillingReportFilterInput,
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

// URL-backed filter/sort/cursor state, cloning useInvoices.ts's cursor-stack
// pattern exactly (M15 plan § Frontend Architecture).
export function useBillingReports() {
  const [searchParams, setSearchParams] = useSearchParams()

  const partnerId = searchParams.get('partnerId') ?? undefined
  const status = readOptionalEnumParam(searchParams, 'status', Object.values(BillingReportStatus))
  const sortField = readEnumParam(
    searchParams,
    'sortField',
    Object.values(BillingReportSortField),
    BillingReportSortField.GeneratedAt,
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

  const filter: BillingReportFilterInput = {}
  if (partnerId !== undefined) filter.partnerId = partnerId
  if (status !== undefined) filter.status = status

  const { data, loading, error, refetch } = useQuery(GetBillingReportsDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter,
      sort: { field: sortField, direction: sortDirection },
    },
  })

  function setFilter(key: 'partnerId' | 'status', value: string | undefined) {
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
    const endCursor = data?.billingReports.pageInfo.endCursor
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
    billingReports: data?.billingReports.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.billingReports.pageInfo,
    filters: { partnerId, status, sortField, sortDirection },
    isLoading: loading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
