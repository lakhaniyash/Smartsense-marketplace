import type { ApolloError } from '@apollo/client'
import type { AuditLogEntry } from '@lib/graphql/__generated__/graphql'
import { Button, ErrorState, Skeleton } from '@shared/components'
import { CustomerTimeline } from './CustomerTimeline'

export interface CustomerActivityTabProps {
  entries: Array<Pick<AuditLogEntry, 'id' | 'action' | 'occurredAt' | 'actorName'>>
  isLoading: boolean
  error: ApolloError | undefined
  onRetry: () => void
}

// The Activity tab on the Customer detail page — wraps CustomerTimeline with
// its own loading/error states, backed by useCustomerAuditLog. A failed
// fetch must not render as "No activity yet": CustomerTimeline's empty
// state is reserved for a genuinely empty audit log.
export function CustomerActivityTab({
  entries,
  isLoading,
  error,
  onRetry,
}: CustomerActivityTabProps) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />
  }

  if (error !== undefined) {
    return (
      <ErrorState
        title="Couldn't load activity"
        description="Something went wrong while loading this customer's activity timeline."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    )
  }

  return <CustomerTimeline entries={entries} />
}
