import { CustomerStatus } from '@lib/graphql/__generated__/graphql'
import { Input, Select, type SelectOption } from '@shared/components'
import { SearchIcon } from '@shared/icons'

const STATUS_OPTIONS: SelectOption[] = [
  { value: CustomerStatus.Active, label: 'Active' },
  { value: CustomerStatus.Suspended, label: 'Suspended' },
]

export interface CustomerFilterBarProps {
  search?: string | undefined
  status?: CustomerStatus | undefined
  onSearchChange: (value: string | undefined) => void
  onStatusChange: (value: string | undefined) => void
}

// Search/filter matches the same list — narrowed, not a separate "browse vs
// search" mode (docs/graphql.md § Searching), same pattern as
// ProductFilterBar — every control here maps onto CustomerFilterInput's
// fields 1:1.
export function CustomerFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: CustomerFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Input
        aria-label="Search"
        placeholder="Search by name or billing email"
        prefixIcon={<SearchIcon className="size-4" aria-hidden="true" />}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value || undefined)}
      />
      <Select
        aria-label="Status"
        placeholder="All statuses"
        clearable
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(event) => onStatusChange((event.target.value as CustomerStatus) || undefined)}
      />
    </div>
  )
}
