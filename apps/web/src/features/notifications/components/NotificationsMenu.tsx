import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link } from 'react-router'
import {
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
} from '@lib/graphql/__generated__/graphql'
import { Badge, Button, EmptyState, Popover, Skeleton } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { NotificationsIcon } from '@shared/icons'
import { useRecentNotifications, useUnreadNotificationCount } from '../hooks'
import { NotificationRow } from './NotificationRow'

const REFETCH_ON_READ = ['GetUnreadNotificationCount', 'GetNotifications']

// The real, data-connected notifications dropdown — replaces the
// shared/components/ui placeholder that only ever rendered an empty state.
// Lives in this feature (not shared/ui) now that it has a GraphQL data
// dependency and exactly one consumer (Header.tsx) — per CLAUDE.md's
// "code moves to shared/ on the *second* real consumer," the inverse holds
// too: a single-consumer, data-connected component doesn't belong in the
// design-system-primitives barrel.
export function NotificationsMenu() {
  const [hasOpened, setHasOpened] = useState(false)
  const { unreadCount } = useUnreadNotificationCount()
  const { notifications, isLoading } = useRecentNotifications(hasOpened)

  const [markAsRead] = useMutation(MarkNotificationReadDocument, {
    refetchQueries: REFETCH_ON_READ,
  })
  const [markAllAsRead, { loading: isMarkingAllRead }] = useMutation(
    MarkAllNotificationsReadDocument,
    { refetchQueries: REFETCH_ON_READ },
  )

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) setHasOpened(true)
      }}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative"
        >
          <NotificationsIcon className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="danger"
              className="absolute -top-1 -right-1 min-w-5 justify-center px-1"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-2 pb-3">
        <p className="text-fg-default text-sm font-semibold">Notifications</p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            isLoading={isMarkingAllRead}
            onClick={() => void markAllAsRead()}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          icon={<NotificationsIcon className="size-8" aria-hidden="true" />}
          title="No notifications yet"
          description="You're all caught up."
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <ul className="flex flex-col gap-1">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkAsRead={(id) => void markAsRead({ variables: { id } })}
              dense
            />
          ))}
        </ul>
      )}

      <div className="border-border-default mt-2 border-t pt-2">
        <Link to={ROUTES.NOTIFICATIONS} className="text-fg-secondary text-sm hover:underline">
          View all
        </Link>
      </div>
    </Popover>
  )
}
