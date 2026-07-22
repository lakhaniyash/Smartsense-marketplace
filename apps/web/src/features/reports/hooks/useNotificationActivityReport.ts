import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import { GetNotificationActivityReportDocument } from '@lib/graphql/__generated__/graphql'
import { resolveReportDateRangeParams, toDateRangeInput } from '../constants'

// Single-aggregate + date-range hook shape (M15 plan § Frontend
// Architecture) — URL-backed `partnerId`/`from`/`to`, one `useQuery`.
export function useNotificationActivityReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined
  const { from, to } = resolveReportDateRangeParams(searchParams)
  const dateRange = toDateRangeInput({ from, to })

  const { data, loading, error, refetch } = useQuery(GetNotificationActivityReportDocument, {
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
    report: data?.notificationActivityReport,
    isLoading: loading,
    error,
    filters: { partnerId, from, to },
    setDateRange,
    setPartnerId,
    refetch,
  }
}
