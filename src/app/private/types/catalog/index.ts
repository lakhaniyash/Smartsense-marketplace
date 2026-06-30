export type SortDirection = 'asc' | 'desc'

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived'

export interface CatalogFilters {
  search?: string
  categoryId?: string
  status?: ProductStatus
  sortBy?: string
  sortDirection?: SortDirection
}
