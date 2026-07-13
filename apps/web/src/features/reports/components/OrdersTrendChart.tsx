import type { GetOrdersReportQuery } from '@lib/graphql/__generated__/graphql'
import { Chart } from '@shared/components'
import { formatEnumLabel } from './formatEnumLabel'

export type OrdersStatusBreakdown = GetOrdersReportQuery['ordersReport']['statusBreakdown'][number]

export interface OrdersTrendChartProps {
  statusBreakdown: OrdersStatusBreakdown[]
}

// Despite the filename (matching the M15 plan's file list), OrdersReport has
// no time-series field on the schema — only totals plus a per-status
// breakdown — so this renders that breakdown as a bar chart, one bar per
// OrderStatus, rather than a trend line.
export function OrdersTrendChart({ statusBreakdown }: OrdersTrendChartProps) {
  const labels = statusBreakdown.map((entry) => formatEnumLabel(entry.status))
  const data = statusBreakdown.map((entry) => entry.count)

  return (
    <Chart
      type="bar"
      labels={labels}
      datasets={[{ label: 'Orders', data, colorRole: 'secondary' }]}
      ariaLabel="Order count by status"
      isEmpty={data.every((count) => count === 0)}
    />
  )
}
