import { NotificationsIcon } from '@shared/icons'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'
import { Popover } from '../Popover'

// A placeholder shell only — there is no Notifications feature yet
// (tracked as a v1.1 module, docs/roadmap.md § Notifications). This never
// fakes an unread count or sample notification data; it says plainly that
// the capability doesn't exist yet rather than implying one that isn't
// built, matching the same posture already applied to the icon-only
// buttons this sits beside in the header.
export function NotificationsMenu() {
  return (
    <Popover
      trigger={
        <Button variant="ghost" size="sm" aria-label="Notifications">
          <NotificationsIcon className="size-5" aria-hidden="true" />
        </Button>
      }
    >
      <EmptyState
        icon={<NotificationsIcon className="size-8" aria-hidden="true" />}
        title="No notifications yet"
        description="Notifications aren't available yet — this is coming in a future release."
      />
    </Popover>
  )
}
