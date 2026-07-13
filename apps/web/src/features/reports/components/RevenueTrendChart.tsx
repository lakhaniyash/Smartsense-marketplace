import type { GetRevenueReportQuery } from '@lib/graphql/__generated__/graphql'
import { Chart } from '@shared/components'

// Structurally identical to ReportsDashboard.revenueTrend's bucket shape
// (same `RevenueReportBucket!]!` field on the schema, per both operations'
// doc comments: "Same formula as RevenueReport.totalGrossRevenue") — this
// one wrapper renders the trend chart on both RevenueReportPage and
// ReportsDashboardPage.
export type RevenueTrendBucket = GetRevenueReportQuery['revenueReport']['trend'][number]

export interface RevenueTrendChartProps {
  trend: RevenueTrendBucket[]
}

export function RevenueTrendChart({ trend }: RevenueTrendChartProps) {
  const labels = trend.map((bucket) => new Date(bucket.bucketStart as string).toLocaleDateString())
  const data = trend.map((bucket) => Number(bucket.grossRevenue))

  return (
    <Chart
      type="line"
      labels={labels}
      datasets={[{ label: 'Gross revenue', data, colorRole: 'primary' }]}
      ariaLabel="Gross revenue trend"
      isEmpty={trend.length === 0}
    />
  )
}
