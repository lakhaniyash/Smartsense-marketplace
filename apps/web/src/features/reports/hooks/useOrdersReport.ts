import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import { GetOrdersReportDocument } from '@lib/graphql/__generated__/graphql'
import { toDateRangeInput } from '../constants'

// Single-aggregate + date-range hook shape (M15 plan § Frontend
// Architecture) — URL-backed `partnerId`/`from`/`to`, one `useQuery`.
export function useOrdersReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const dateRange = toDateRangeInput({ from, to })

  const { data, loading, error, refetch } = useQuery(GetOrdersReportDocument, {
    variables: {
      filter: {
        ...(partnerId !== undefined && { partnerId }),
        ...(dateRange !== undefined && { dateRange }),
      },
    },
  })

  function setDateRange(range: { from: string | undefined; to: string | undefined }) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
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
      if (value === undefined) next.delete('partnerId')
      else next.set('partnerId', value)
      return next
    })
  }

  return {
    report: data?.ordersReport,
    isLoading: loading,
    error,
    filters: { partnerId, from, to },
    setDateRange,
    setPartnerId,
    refetch,
  }
}
