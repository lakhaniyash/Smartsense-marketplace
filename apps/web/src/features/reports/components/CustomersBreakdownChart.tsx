import type { GetCustomersReportQuery } from '@lib/graphql/__generated__/graphql'
import { Chart } from '@shared/components'
import { formatEnumLabel } from './formatEnumLabel'

export type CustomersStatusBreakdown =
  GetCustomersReportQuery['customersReport']['statusBreakdown'][number]
export type CustomersTypeBreakdown =
  GetCustomersReportQuery['customersReport']['typeBreakdown'][number]

export interface CustomersBreakdownChartProps {
  statusBreakdown: CustomersStatusBreakdown[]
  typeBreakdown: CustomersTypeBreakdown[]
}

// Two bar charts — status and type — same "one bar per enum value" shape as
// OrdersTrendChart, just doubled since CustomersReport carries two
// independent breakdowns rather than one.
export function CustomersBreakdownChart({
  statusBreakdown,
  typeBreakdown,
}: CustomersBreakdownChartProps) {
  const statusLabels = statusBreakdown.map((entry) => formatEnumLabel(entry.status))
  const statusData = statusBreakdown.map((entry) => entry.count)
  const typeLabels = typeBreakdown.map((entry) => formatEnumLabel(entry.type))
  const typeData = typeBreakdown.map((entry) => entry.count)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Chart
        type="bar"
        labels={statusLabels}
        datasets={[{ label: 'Customers', data: statusData, colorRole: 'secondary' }]}
        ariaLabel="Customer count by status"
        isEmpty={statusData.every((count) => count === 0)}
      />
      <Chart
        type="bar"
        labels={typeLabels}
        datasets={[{ label: 'Customers', data: typeData }]}
        ariaLabel="Customer count by type"
        isEmpty={typeData.every((count) => count === 0)}
      />
    </div>
  )
}
