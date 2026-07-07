import type { OrderSortField, OrderStatus, SortDirection } from '@lib/graphql/__generated__/graphql'

// URL-backed filter/sort state for the order list — same pattern as
// CatalogFilters (docs/frontend-architecture.md § State Management Strategy).
export interface OrderFilters {
  status?: OrderStatus | undefined
  sortField?: OrderSortField | undefined
  sortDirection?: SortDirection | undefined
}
