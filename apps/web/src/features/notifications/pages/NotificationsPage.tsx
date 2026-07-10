import { useMutation } from '@apollo/client'
import {
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
} from '@shared/components'
import { NotificationFilterBar } from '../components/NotificationFilterBar'
import { NotificationRow } from '../components/NotificationRow'
import { useNotifications, useUnreadNotificationCount } from '../hooks'

const REFETCH_ON_READ = ['GetUnreadNotificationCount', 'GetNotifications']

function NotificationListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// The Notification list — M16 (docs/milestones.md). Route-level composition
// only: calls the feature's hooks, branches the four view states, arranges
// components (docs/frontend-architecture.md § Feature Module Architecture).
// A plain <ol> feed (via NotificationRow), not Table — a notification is
// single-blob prose with one binary state, matching OrderTimeline's feed
// layout for the same reason, not columnar invoice/order data.
export function NotificationsPage() {
  const {
    notifications,
    pageInfo,
    readState,
    isLoading,
    error,
    setReadState,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useNotifications()
  const { unreadCount } = useUnreadNotificationCount()

  const [markAsRead] = useMutation(MarkNotificationReadDocument, {
    refetchQueries: REFETCH_ON_READ,
  })
  const [markAllAsRead, { loading: isMarkingAllRead }] = useMutation(
    MarkAllNotificationsReadDocument,
    { refetchQueries: REFETCH_ON_READ },
  )

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Events from your orders and invoices."
        action={
          <Button
            variant="secondary"
            isLoading={isMarkingAllRead}
            disabled={unreadCount === 0}
            onClick={() => void markAllAsRead()}
          >
            Mark all as read
          </Button>
        }
      />

      <NotificationFilterBar readState={readState} onReadStateChange={setReadState} />

      {isLoading && <NotificationListSkeleton />}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load notifications"
          description="Something went wrong while loading your notifications."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && notifications.length === 0 && readState !== 'all' && (
        <EmptyState
          title="No notifications match this filter"
          description="Try a different filter, or clear it to see all notifications."
          action={
            <Button variant="secondary" size="sm" onClick={() => setReadState('all')}>
              Clear filter
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && notifications.length === 0 && readState === 'all' && (
        <EmptyState
          title="No notifications yet"
          description="Events from your orders and invoices will show up here."
        />
      )}

      {!isLoading && error === undefined && notifications.length > 0 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ol className="flex-1 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => void markAsRead({ variables: { id } })}
              />
            ))}
          </ol>
          <div className="border-border-default border-t pt-3">
            <Pagination
              hasPreviousPage={hasPreviousPage}
              hasNextPage={pageInfo?.hasNextPage ?? false}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
