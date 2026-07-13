import type { GetProductPerformanceReportQuery } from '@lib/graphql/__generated__/graphql'
import { Chart } from '@shared/components'

export type ProductPerformanceItem =
  GetProductPerformanceReportQuery['productPerformanceReport']['edges'][number]['node']

export interface ProductPerformanceChartProps {
  items: ProductPerformanceItem[]
}

// One bar per ranked Product Variant on the current page — the ranking
// itself (sort field/direction) is the table's job (ProductPerformanceReportPage);
// this chart just visualizes whatever page of `items` it's handed.
export function ProductPerformanceChart({ items }: ProductPerformanceChartProps) {
  const labels = items.map((item) => item.productTitle)
  const data = items.map((item) => Number(item.revenue))

  return (
    <Chart
      type="bar"
      labels={labels}
      datasets={[{ label: 'Revenue', data, colorRole: 'primary' }]}
      ariaLabel="Revenue by product"
      isEmpty={items.length === 0}
    />
  )
}
