import { Card, CardContent } from '../Card'
import { Skeleton } from '../Skeleton'

// Copies the skeleton block shape already used for dashboard stat cards
// (apps/web/src/features/dashboard/components/StatisticsGrid.tsx) rather than
// inventing a new loading layout - an icon square plus a label line and a
// value line, so a KPI grid's loading state reads identically to the
// dashboard's, wherever both appear.
export function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
