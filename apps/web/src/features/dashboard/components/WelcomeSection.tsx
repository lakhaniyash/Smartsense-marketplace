import { useCurrentUser } from '@features/auth'
import { Skeleton } from '@shared/components'

// Degrades quietly on error/no-data (falls back to a generic greeting)
// rather than surfacing its own ErrorState — a failed name lookup isn't
// worth blocking the rest of the page, unlike the stats section below.
export function WelcomeSection() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
    )
  }

  const roleLabel = user?.roles[0] ?? 'Member'

  return (
    <div>
      <h2 className="text-fg-default text-xl font-semibold">
        Welcome back{user?.fullName !== undefined ? `, ${user.fullName}` : ''}
      </h2>
      <p className="text-fg-muted mt-1 text-sm">{roleLabel} overview</p>
    </div>
  )
}
