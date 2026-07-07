import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { Input, Select, type SelectOption } from '@shared/components'
import { CategorySelect } from './CategorySelect'

const STATUS_OPTIONS: SelectOption[] = [
  { value: ProductStatus.Draft, label: 'Draft' },
  { value: ProductStatus.PendingReview, label: 'Pending review' },
  { value: ProductStatus.Published, label: 'Published' },
  { value: ProductStatus.Archived, label: 'Archived' },
]

export interface ProductFilterBarProps {
  search?: string | undefined
  categoryId?: string | undefined
  status?: ProductStatus | undefined
  onSearchChange: (value: string | undefined) => void
  onCategoryChange: (value: string | undefined) => void
  onStatusChange: (value: string | undefined) => void
}

// Search/filter matches the same list — narrowed, not a separate "browse vs
// search" mode (docs/graphql.md § Searching) — every control here maps onto
// ProductFilterInput's fields 1:1.
export function ProductFilterBar({
  search,
  categoryId,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Input
        label="Search"
        placeholder="Search by name or SKU"
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value || undefined)}
      />
      <CategorySelect
        placeholder="All categories"
        clearable
        value={categoryId ?? ''}
        onChange={(event) => onCategoryChange(event.target.value || undefined)}
      />
      <Select
        label="Status"
        placeholder="All statuses"
        clearable
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(event) => onStatusChange((event.target.value as ProductStatus) || undefined)}
      />
    </div>
  )
}
