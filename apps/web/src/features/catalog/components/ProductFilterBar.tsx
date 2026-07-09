import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { Input, Select, type SelectOption } from '@shared/components'
import { SearchIcon } from '@shared/icons'
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
    // Filter controls skip the visible label docs/ui-guidelines.md § Forms
    // requires for data-entry fields — a placeholder ("All categories",
    // "All statuses") or a persistent icon (the search glass, which
    // survives typed input unlike placeholder text) already discloses each
    // filter's purpose to a sighted user, so a second, redundant label
    // above every control just costs vertical space (docs/ui-guidelines.md
    // § Tables — Filtering). Each still carries an aria-label for the same
    // accessible name a visible label would have given screen readers.
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Input
        aria-label="Search"
        placeholder="Search by name or SKU"
        prefixIcon={<SearchIcon className="size-4" aria-hidden="true" />}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value || undefined)}
      />
      <CategorySelect
        hideLabel
        placeholder="All categories"
        clearable
        value={categoryId ?? ''}
        onChange={(event) => onCategoryChange(event.target.value || undefined)}
      />
      <Select
        aria-label="Status"
        placeholder="All statuses"
        clearable
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(event) => onStatusChange((event.target.value as ProductStatus) || undefined)}
      />
    </div>
  )
}
