import { usePermissions } from '@features/auth'
import { Button, Card, CardContent, EmptyState, ErrorState, Skeleton } from '@shared/components'
import { useDashboard } from '../hooks/useDashboard'
import { buildStatCards, canViewRevenuePlaceholder } from '../services/dashboard.service'
import { DashboardStatCard } from './DashboardStatCard'
import { RevenuePlaceholderCard } from './RevenuePlaceholderCard'

const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'

// Fetched independently from WelcomeSection/QuickActions/RecentActivity, so
// this section shows its own loading/error/empty state without blocking the
// rest of the page (docs/ui-guidelines.md § Progressive Loading).
export function StatisticsGrid() {
  const { stats, isLoading, error, refetch } = useDashboard()
  const { can, isLoading: isPermissionsLoading } = usePermissions()

  if (isLoading || isPermissionsLoading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || stats === undefined) {
    return (
      <Card>
        <ErrorState
          title="Couldn't load statistics"
          description="Something went wrong while loading dashboard statistics."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  const statCards = buildStatCards(stats, can)
  const showRevenuePlaceholder = canViewRevenuePlaceholder(can)

  if (statCards.length === 0 && !showRevenuePlaceholder) {
    return (
      <Card>
        <EmptyState
          title="No statistics available"
          description="You don't have access to any dashboard metrics yet."
        />
      </Card>
    )
  }

  return (
    <div className={GRID_CLASSES}>
      {statCards.map((card) => (
        <DashboardStatCard key={card.key} card={card} />
      ))}
      {showRevenuePlaceholder && <RevenuePlaceholderCard />}
    </div>
  )
}
