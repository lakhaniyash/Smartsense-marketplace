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
          className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {entry.fromStatus !== null && entry.fromStatus !== undefined && (
                <>
                  <OrderStatusBadge status={entry.fromStatus} />
                  <span className="text-gray-400">&rarr;</span>
                </>
              )}
              <OrderStatusBadge status={entry.toStatus} />
            </div>
            <span className="text-sm text-gray-500">
              {new Date(entry.createdAt as string).toLocaleString()}
            </span>
            {entry.reason !== null && entry.reason !== undefined && (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Reason: {entry.reason}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
