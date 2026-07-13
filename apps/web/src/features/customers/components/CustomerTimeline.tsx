import type { AuditLogEntry } from '@lib/graphql/__generated__/graphql'
import { EmptyState } from '@shared/components'

const ACTION_LABEL: Record<string, string> = {
  CUSTOMER_CREATED: 'Customer created',
  CUSTOMER_UPDATED: 'Customer details updated',
  CUSTOMER_ARCHIVED: 'Customer suspended',
  CUSTOMER_ACTIVATED: 'Customer reactivated',
}

// Falls back to the raw action string for anything not in the map above —
// forward-compatible with an action this page doesn't know about yet,
// rather than rendering nothing.
function labelForAction(action: string): string {
  return ACTION_LABEL[action] ?? action
}

export interface CustomerTimelineProps {
  entries: Array<Pick<AuditLogEntry, 'id' | 'action' | 'occurredAt' | 'actorName'>>
}

// Generic activity timeline over AuditLogEntry — same structural pattern as
// OrderTimeline (ordered list, per-entry label + timestamp, empty state),
// applied to the AuditLog model instead of Order's dedicated status-history
// table (docs/ui-guidelines.md's Component Hierarchy).
export function CustomerTimeline({ entries }: CustomerTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Changes to this customer will appear here."
      />
    )
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-border-default flex items-start gap-3 border-b pb-4 last:border-0"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-fg-default text-sm font-medium">
              {labelForAction(entry.action)}
            </span>
            <span className="text-fg-muted text-sm">
              {new Date(entry.occurredAt as string).toLocaleString()} &middot; {entry.actorName}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
