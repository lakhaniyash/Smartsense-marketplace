import { EmptyState } from '@shared/components'

// Same lookup-map pattern as CustomerTimeline — a known action gets a human
// label, an unknown one falls back to its raw key (never renders nothing).
const ACTION_LABEL: Record<string, string> = {
  USER_INVITED: 'User invited',
  USER_SUSPENDED: 'User suspended',
  USER_REACTIVATED: 'User reactivated',
  USER_ROLE_ASSIGNED: 'Role assigned',
  USER_ROLE_REMOVED: 'Role removed',
  USER_PASSWORD_RESET_SENT: 'Password reset email sent',
}

function labelForAction(action: string): string {
  return ACTION_LABEL[action] ?? action
}

export interface UserTimelineEntry {
  id: string
  action: string
  occurredAt: unknown
  actorName: string
}

export interface UserTimelineProps {
  entries: UserTimelineEntry[]
}

export function UserTimeline({ entries }: UserTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Invites, role changes, and status changes for this user will show up here."
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
          <div className="flex flex-col gap-0.5">
            <span className="text-fg-default text-sm font-medium">
              {labelForAction(entry.action)}
            </span>
            <span className="text-fg-muted text-xs">
              {new Date(entry.occurredAt as string).toLocaleString()} &middot; {entry.actorName}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
