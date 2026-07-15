import type { ApolloError } from '@apollo/client'
import { Button, ErrorState, Skeleton } from '@shared/components'
import { UserTimeline, type UserTimelineEntry } from './UserTimeline'

export interface UserActivityTabProps {
  entries: UserTimelineEntry[]
  isLoading: boolean
  error: ApolloError | undefined
  onRetry: () => void
}

// Owns loading/error; delegates empty + list to UserTimeline. A failed fetch
// must render a real error state with retry, never the empty state (same rule
// as CustomerActivityTab).
export function UserActivityTab({ entries, isLoading, error, onRetry }: UserActivityTabProps) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />
  }
  if (error !== undefined) {
    return (
      <ErrorState
        title="Couldn't load activity"
        description="Something went wrong while loading this user's activity."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    )
  }
  return <UserTimeline entries={entries} />
}
