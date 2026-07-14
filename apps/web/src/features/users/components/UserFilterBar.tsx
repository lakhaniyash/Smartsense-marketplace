import { UserOwnerType, UserStatus } from '@lib/graphql/__generated__/graphql'
import { Input, Select, type SelectOption } from '@shared/components'
import { SearchIcon } from '@shared/icons'

const STATUS_OPTIONS: SelectOption[] = [
  { value: UserStatus.Active, label: 'Active' },
  { value: UserStatus.Invited, label: 'Invited' },
  { value: UserStatus.Suspended, label: 'Suspended' },
  { value: UserStatus.Deactivated, label: 'Deactivated' },
]

const OWNER_TYPE_OPTIONS: SelectOption[] = [
  { value: UserOwnerType.None, label: 'Platform' },
  { value: UserOwnerType.Partner, label: 'Partner' },
  { value: UserOwnerType.Customer, label: 'Customer' },
]

export interface UserFilterBarProps {
  search?: string | undefined
  status?: UserStatus | undefined
  ownerType?: UserOwnerType | undefined
  onSearchChange: (value: string | undefined) => void
  onStatusChange: (value: string | undefined) => void
  onOwnerTypeChange: (value: string | undefined) => void
}

// Search/filter narrows the same list, not a separate mode (docs/graphql.md
// § Searching) — each control maps onto UserFilterInput's fields 1:1, same
// pattern as CustomerFilterBar.
export function UserFilterBar({
  search,
  status,
  ownerType,
  onSearchChange,
  onStatusChange,
  onOwnerTypeChange,
}: UserFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Input
        aria-label="Search"
        placeholder="Search by name or email"
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
        onChange={(event) => onStatusChange((event.target.value as UserStatus) || undefined)}
      />
      <Select
        aria-label="Owner type"
        placeholder="All owner types"
        clearable
        options={OWNER_TYPE_OPTIONS}
        value={ownerType ?? ''}
        onChange={(event) => onOwnerTypeChange((event.target.value as UserOwnerType) || undefined)}
      />
    </div>
  )
}
