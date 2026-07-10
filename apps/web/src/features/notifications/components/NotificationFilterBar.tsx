import { Select, type SelectOption } from '@shared/components'
import type { NotificationReadFilter } from '../types'

const READ_STATE_OPTIONS: SelectOption[] = [
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export interface NotificationFilterBarProps {
  readState: NotificationReadFilter
  onReadStateChange: (value: NotificationReadFilter) => void
}

// Same Select-based filter-bar convention as InvoiceFilterBar/OrderFilterBar
// (docs/ui-guidelines.md § Tables — Filtering) — no visible label, the
// placeholder already discloses the filter's purpose.
export function NotificationFilterBar({
  readState,
  onReadStateChange,
}: NotificationFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Select
        aria-label="Read status"
        placeholder="All"
        clearable
        options={READ_STATE_OPTIONS}
        value={readState === 'all' ? '' : readState}
        onChange={(event) => {
          const value = event.target.value
          onReadStateChange(value === 'unread' || value === 'read' ? value : 'all')
        }}
      />
    </div>
  )
}
