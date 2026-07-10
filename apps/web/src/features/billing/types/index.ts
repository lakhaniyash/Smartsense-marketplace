import type {
  InvoiceSortField,
  InvoiceStatus,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'

// URL-backed filter/sort state for the invoice list — same pattern as
// OrderFilters (docs/frontend-architecture.md § State Management Strategy).
export interface InvoiceFilters {
  status?: InvoiceStatus | undefined
  sortField?: InvoiceSortField | undefined
  sortDirection?: SortDirection | undefined
}
