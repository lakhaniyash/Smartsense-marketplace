import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  GetRevenueReportDocument,
  RevenueBucketGranularity,
} from '@lib/graphql/__generated__/graphql'
import { toDateRangeInput } from '../constants'

function readGranularity(searchParams: URLSearchParams): RevenueBucketGranularity {
  const raw = searchParams.get('granularity')
  const allowed = Object.values(RevenueBucketGranularity) as string[]
  return allowed.includes(raw ?? '')
    ? (raw as RevenueBucketGranularity)
    : RevenueBucketGranularity.Month
}

// Single-aggregate + date-range hook shape (M15 plan § Frontend
// Architecture) — URL-backed `partnerId`/`from`/`to`/`granularity`, one
// `useQuery`.
export function useRevenueReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const granularity = readGranularity(searchParams)
  const dateRange = toDateRangeInput({ from, to })

  const { data, loading, error, refetch } = useQuery(GetRevenueReportDocument, {
    variables: {
      filter: {
        granularity,
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

  function setGranularity(value: RevenueBucketGranularity) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('granularity', value)
      return next
    })
  }

  return {
    report: data?.revenueReport,
    isLoading: loading,
    error,
    filters: { partnerId, from, to, granularity },
    setDateRange,
    setPartnerId,
    setGranularity,
    refetch,
  }
}
