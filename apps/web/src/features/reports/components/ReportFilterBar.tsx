import type { ReactNode } from 'react'
import { DateRangePicker, type DateRangeValue } from '@shared/components'

export interface ReportFilterBarProps {
  dateRange: DateRangeValue
  onDateRangeChange: (range: DateRangeValue) => void
  // A page-specific control slot (BillingReportsPage's status filter,
  // ProductPerformanceReportPage's sort control) — every date-ranged report
  // page's filter row is this one shape plus whatever it alone needs.
  extraFilters?: ReactNode
}

// Composes DateRangePicker for every date-ranged report page (Revenue/
// Orders/Notification Activity/Product Performance/Billing Reports/
// Dashboard) — InventoryReportPage skips this entirely, since InventoryReport
// is a point-in-time snapshot with no date range (its own doc comment,
// apps/api/src/schema.gql).
//
// No partner selector: there is no GraphQL query listing partners
// ({id, name}) anywhere in the schema today (verified directly against
// apps/api/src/schema.gql — no `Partner` type, no `partners`/`partnerOptions`
// query). The M15 plan flagged this as an open risk to resolve before this
// component shipped, not defer silently (§5 "Known open dependency"). Rather
// than invent a query the backend doesn't expose or block this pass on a new
// endpoint, an Admin caller sees the all-partners aggregate only (every
// report query treats an omitted `partnerId` as "all partners" for Admin,
// per each resolver's `resolvePartnerScope`); per-partner drill-down is a
// follow-up once a partner-listing query exists.
export function ReportFilterBar({
  dateRange,
  onDateRangeChange,
  extraFilters,
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      {extraFilters}
    </div>
  )
}
