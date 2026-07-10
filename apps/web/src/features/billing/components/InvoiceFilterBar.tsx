import { InvoiceStatus } from '@lib/graphql/__generated__/graphql'
import { Select, type SelectOption } from '@shared/components'

const STATUS_OPTIONS: SelectOption[] = [
  { value: InvoiceStatus.Draft, label: 'Draft' },
  { value: InvoiceStatus.Issued, label: 'Issued' },
  { value: InvoiceStatus.PartiallyPaid, label: 'Partially paid' },
  { value: InvoiceStatus.Paid, label: 'Paid' },
  { value: InvoiceStatus.Void, label: 'Void' },
]

export interface InvoiceFilterBarProps {
  status?: InvoiceStatus | undefined
  onStatusChange: (value: string | undefined) => void
}

export function InvoiceFilterBar({ status, onStatusChange }: InvoiceFilterBarProps) {
  return (
    // No visible label — see OrderFilterBar's comment on this same pattern
    // (docs/ui-guidelines.md § Tables — Filtering): the placeholder already
    // discloses the filter's purpose, and aria-label keeps the same
    // accessible name a visible label would have given.
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Select
        aria-label="Status"
        placeholder="All statuses"
        clearable
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(event) => onStatusChange(event.target.value || undefined)}
      />
    </div>
  )
}
