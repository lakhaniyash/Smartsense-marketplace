import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components'
import { buildQuickActions } from '../services/dashboard.service'

// Plain `Link` styled as a button rather than the shared `Button` component:
// Button renders a real `<button>` with no navigation semantics, and these
// are navigation actions, not form actions (same reasoning as Sidebar's
// NavLink usage).
export function QuickActions() {
  const { can, isLoading } = usePermissions()

  if (isLoading) return null

  const actions = buildQuickActions(can)
  if (actions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 pt-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.key}
              to={action.href}
              className="border-border-control bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Icon className="size-4" aria-hidden="true" />
              {action.label}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
