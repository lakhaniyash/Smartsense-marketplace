import type {
  ProductSortField,
  ProductStatus,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'

// URL-backed filter/sort state for the product list (docs/frontend-architecture.md
// § State Management Strategy — "URL-worthy state" lives in search params, not
// memory). The enum-typed fields reference GraphQL Code Generator's output
// directly rather than redeclaring them (docs/coding-standards.md § No
// Handwritten GraphQL Types).
export interface CatalogFilters {
  search?: string | undefined
  categoryId?: string | undefined
  status?: ProductStatus | undefined
  sortField?: ProductSortField | undefined
  sortDirection?: SortDirection | undefined
}
