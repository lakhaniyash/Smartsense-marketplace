import type {
  BillingReportSortField,
  BillingReportStatus,
  ProductPerformanceSortField,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'

// URL-backed date-range + partner scope shared by every single-aggregate
// report hook (Revenue/Orders/Notification Activity/Dashboard) — Inventory
// omits `from`/`to` since it's a point-in-time snapshot, not a period report
// (docs/domain-model.md § Inventory; apps/api/src/schema.gql's InventoryReport
// doc comment).
export interface ReportDateRangeFilters {
  partnerId?: string | undefined
  from?: string | undefined
  to?: string | undefined
}

// Point-in-time scope for the Inventory report — no date range.
export interface ReportPartnerFilters {
  partnerId?: string | undefined
}

// URL-backed filter/sort state for the billing report list — same pattern as
// InvoiceFilters (docs/frontend-architecture.md § State Management Strategy).
export interface BillingReportFilters {
  partnerId?: string | undefined
  status?: BillingReportStatus | undefined
  sortField?: BillingReportSortField | undefined
  sortDirection?: SortDirection | undefined
}

// URL-backed filter/sort state for the product performance ranking.
export interface ProductPerformanceFilters {
  partnerId?: string | undefined
  from?: string | undefined
  to?: string | undefined
  sortField?: ProductPerformanceSortField | undefined
  sortDirection?: SortDirection | undefined
}
