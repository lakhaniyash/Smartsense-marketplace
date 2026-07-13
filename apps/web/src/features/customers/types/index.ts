import type { CustomerStatus } from '@lib/graphql/__generated__/graphql'

// URL-backed filter state for the customer list — same pattern as
// OrderFilters/CatalogFilters (docs/frontend-architecture.md § State
// Management Strategy).
export interface CustomerFilters {
  search?: string | undefined
  status?: CustomerStatus | undefined
}
