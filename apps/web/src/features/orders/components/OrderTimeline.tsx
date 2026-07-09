import type { OrderStatusHistoryEntry } from '@lib/graphql/__generated__/graphql'
import { EmptyState } from '@shared/components'
import { OrderStatusBadge } from './OrderStatusBadge'

export interface OrderTimelineProps {
  entries: OrderStatusHistoryEntry[]
}

// Named as the canonical example in docs/ui-guidelines.md's Component
// Hierarchy for a feature component showing an order's status history.
export function OrderTimeline({ entries }: OrderTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No status history yet"
        description="Changes to this order will appear here."
      />
    )
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li
          key={entry.id}
          // Divider was `border-gray-100` in light mode (one step lighter than
          // border-border-default's `border-gray-200`) but matches the token's
          // dark value exactly; same divider role, closest semantic match.
          className="border-border-default flex items-start gap-3 border-b pb-4 last:border-0"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {entry.fromStatus !== null && entry.fromStatus !== undefined && (
                <>
                  <OrderStatusBadge status={entry.fromStatus} />
                  <span className="text-fg-muted">&rarr;</span>
                </>
              )}
              <OrderStatusBadge status={entry.toStatus} />
            </div>
            <span className="text-fg-muted text-sm">
              {new Date(entry.createdAt as string).toLocaleString()}
            </span>
            {entry.reason !== null && entry.reason !== undefined && (
              <span className="text-fg-secondary text-sm">Reason: {entry.reason}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
