import { PageHeader } from '@shared/components'
import { QuickActions, RecentActivity, StatisticsGrid, WelcomeSection } from '../components'

// No Breadcrumb here: /dashboard is the app's landing route (one level
// deep), and docs/ui-guidelines.md § Navigation reserves Breadcrumb for
// pages nested more than one level deep. Each section below fetches
// independently and owns its own loading/error/empty state — see
// StatisticsGrid, the only section backed by a real query today.
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="An overview of marketplace activity." />
      <WelcomeSection />
      <StatisticsGrid />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <QuickActions />
      </div>
    </div>
  )
}
