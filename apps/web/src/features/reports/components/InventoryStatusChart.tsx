import { Chart } from '@shared/components'

export interface InventoryStatusChartProps {
  totalVariants: number
  lowStockCount: number
}

// A doughnut of healthy-vs-low-stock Variant counts — InventoryReport has no
// per-status breakdown field on the schema (only scalar totals), so this
// derives the two slices from `totalVariants`/`lowStockCount` rather than a
// server-provided breakdown.
export function InventoryStatusChart({ totalVariants, lowStockCount }: InventoryStatusChartProps) {
  const healthyCount = Math.max(totalVariants - lowStockCount, 0)

  return (
    <Chart
      type="doughnut"
      labels={['Healthy stock', 'Low stock']}
      datasets={[{ label: 'Variants', data: [healthyCount, lowStockCount] }]}
      ariaLabel="Variant stock health"
      isEmpty={totalVariants === 0}
    />
  )
}
