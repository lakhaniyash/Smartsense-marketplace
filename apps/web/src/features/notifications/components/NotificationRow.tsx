import { Link } from 'react-router'
import type { NotificationStatus } from '@lib/graphql/__generated__/graphql'
import { cn } from '@shared/utils'
import { ROUTES } from '@shared/constants'

export interface NotificationRowNode {
  id: string
  title: string
  body: string
  entityType?: string | null
  entityId?: string | null
  status: NotificationStatus
  createdAt: unknown
}

export interface NotificationRowProps {
  notification: NotificationRowNode
  onMarkAsRead: (id: string) => void
  /** Tighter spacing for the header dropdown's small fixed list. */
  dense?: boolean
}

// Maps an event-sourced Notification back to the entity it's about — the
// only two entity types this milestone's event set produces (Order via
// Orders' 4 lifecycle events, Invoice via Billing's 2 new events).
function resolveNotificationLink(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | undefined {
  if (entityType === undefined || entityType === null) return undefined
  if (entityId === undefined || entityId === null) return undefined
  if (entityType === 'Order') return `${ROUTES.ORDERS}/${entityId}`
  if (entityType === 'Invoice') return `${ROUTES.BILLING}/${entityId}`
  return undefined
}

// Shared by both the header dropdown and the full /notifications page — a
// notification is single-blob prose (title + body + timestamp) with one
// binary state, not columnar data, so this is a plain row, not a Table row
// (same reasoning as OrderTimeline's feed layout).
export function NotificationRow({
  notification,
  onMarkAsRead,
  dense = false,
}: NotificationRowProps) {
  const isUnread = notification.status === 'UNREAD'
  const href = resolveNotificationLink(notification.entityType, notification.entityId)

  function handleClick() {
    if (isUnread) onMarkAsRead(notification.id)
  }

  const content = (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md px-2 py-2',
        href !== undefined && 'hover:bg-surface-hover cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm',
            isUnread ? 'text-fg-default font-semibold' : 'text-fg-secondary',
          )}
        >
          {notification.title}
        </p>
        {isUnread && (
          <span
            aria-label="Unread"
            className="bg-danger-emphasis mt-1.5 size-2 shrink-0 rounded-full"
          />
        )}
      </div>
      {!dense && <p className="text-fg-muted text-sm">{notification.body}</p>}
      <span className="text-fg-muted text-xs">
        {new Date(notification.createdAt as string).toLocaleString()}
      </span>
    </div>
  )

  if (href === undefined) {
    return (
      <li className={cn(!dense && 'border-border-default border-b pb-4 last:border-0')}>
        <button type="button" onClick={handleClick} className="w-full text-left">
          {content}
        </button>
      </li>
    )
  }

  return (
    <li className={cn(!dense && 'border-border-default border-b pb-4 last:border-0')}>
      <Link to={href} onClick={handleClick} className="block">
        {content}
      </Link>
    </li>
  )
}
