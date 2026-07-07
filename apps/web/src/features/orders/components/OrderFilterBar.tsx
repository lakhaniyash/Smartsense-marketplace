import { OrderStatus } from '@lib/graphql/__generated__/graphql'
import { Select, type SelectOption } from '@shared/components'

const STATUS_OPTIONS: SelectOption[] = [
  { value: OrderStatus.Draft, label: 'Draft' },
  { value: OrderStatus.Confirmed, label: 'Confirmed' },
  { value: OrderStatus.Processing, label: 'Processing' },
  { value: OrderStatus.Cancelled, label: 'Cancelled' },
]

export interface OrderFilterBarProps {
  status?: OrderStatus | undefined
  onStatusChange: (value: string | undefined) => void
}

// Only the four statuses M13 actually drives are offered here — the schema's
// remaining OrderStatus values aren't reachable yet (see OrderStatusBadge's
// comment), so filtering by them would only ever return an empty list.
export function OrderFilterBar({ status, onStatusChange }: OrderFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Select
        label="Status"
        placeholder="All statuses"
        clearable
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(event) => onStatusChange(event.target.value || undefined)}
      />
    </div>
  )
}
