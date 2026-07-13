import { Button, ErrorState, KpiCard, PageHeader } from '@shared/components'
import { ReportFilterBar, ReportsNavCard, RevenueTrendChart } from '../components'
import { REPORTS_NAV_ITEMS } from '../constants'
import { useReportsDashboard } from '../hooks'

const KPI_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
const NAV_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

// The Reports landing page — KPI cards + revenue trend + a link grid to
// every report route (M15 plan § Frontend Architecture). No export action
// here: `ReportExportType` has no DASHBOARD member on the schema, only one
// per underlying report page.
//
// This is an aggregate-only query (no list to be genuinely "empty" the way
// Invoices/Billing Reports can be) — the fourth view state is expressed by
// `RevenueTrendChart`'s own `isEmpty` branch (Chart.tsx's "one place to
// apply... the 'no data' empty-state branch") rather than a redundant
// page-level EmptyState that would hide otherwise-meaningful zero-value KPIs.
export function ReportsDashboardPage() {
  const { dashboard, isLoading, error, filters, setDateRange, refetch } = useReportsDashboard()

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader title="Reports" description="An overview of marketplace reporting." />
      <ReportFilterBar
        dateRange={{ from: filters.from, to: filters.to }}
        onDateRangeChange={setDateRange}
      />

      {isLoading && (
        <div className={KPI_GRID_CLASSES}>
          {Array.from({ length: 4 }, (_, index) => (
            <KpiCard key={index} label="" value={0} isLoading />
          ))}
        </div>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load the reports dashboard"
          description="Something went wrong while loading the summary."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && dashboard !== undefined && (
        // The KPI/chart/nav body scrolls in its own bounded region; PageHeader
        // and ReportFilterBar stay pinned above it, matching CatalogPage's
        // table-scrolls-not-the-page convention (docs/ui-guidelines.md §
        // Tables — Pagination row) — this page has the most content of any
        // Reports screen (KPIs + chart + 6 nav cards), so it's the one most
        // likely to actually overflow a viewport.
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
            <div className={KPI_GRID_CLASSES}>
              <KpiCard
                label="Gross revenue"
                value={Number(dashboard.grossRevenue)}
                format="currency"
              />
              <KpiCard
                label="Orders revenue"
                value={Number(dashboard.ordersRevenue)}
                format="currency"
              />
              <KpiCard label="Total orders" value={dashboard.totalOrders} format="count" />
              <KpiCard label="Low stock items" value={dashboard.lowStockCount} format="count" />
            </div>
            <RevenueTrendChart trend={dashboard.revenueTrend} />
            <div className={NAV_GRID_CLASSES}>
              {REPORTS_NAV_ITEMS.map((item) => (
                <ReportsNavCard
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
