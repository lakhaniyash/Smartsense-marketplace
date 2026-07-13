import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import { GetInventoryReportDocument } from '@lib/graphql/__generated__/graphql'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'

// Point-in-time snapshot — no date range, unlike every other report
// (InventoryReport's own doc comment, apps/api/src/schema.gql), but its
// `lowStockItems` field is itself a paginated connection, so this hook still
// needs useInvoices.ts's cursor-stack pattern for that nested list even
// though the top-level query has no date filter.
export function useInventoryReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined
  const after = searchParams.get('after') ?? undefined
  const cursorStackParam = searchParams.get('cursorStack')
  const cursorStack = cursorStackParam === null ? [] : cursorStackParam.split(',')

  const { data, loading, error, refetch } = useQuery(GetInventoryReportDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter: { ...(partnerId !== undefined && { partnerId }) },
    },
  })

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

  function goToNextPage() {
    const endCursor = data?.inventoryReport.lowStockItems.pageInfo.endCursor
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
    report: data?.inventoryReport,
    lowStockItems: data?.inventoryReport.lowStockItems.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.inventoryReport.lowStockItems.pageInfo,
    isLoading: loading,
    error,
    filters: { partnerId },
    setPartnerId,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
