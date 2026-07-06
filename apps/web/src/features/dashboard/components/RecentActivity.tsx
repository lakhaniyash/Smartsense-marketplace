import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@shared/components'
import { ActivityIcon } from '@shared/icons'

// Placeholder only — wires up to real activity data once Orders/Catalog
// (M12–M13) exist to produce events from (docs/milestones.md M11).
export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<ActivityIcon className="size-10" aria-hidden="true" />}
          title="No recent activity yet"
          description="Activity from Orders and Catalog will appear here once those modules are live."
        />
      </CardContent>
    </Card>
  )
}
