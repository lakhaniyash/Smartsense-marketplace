import { Link } from 'react-router'
import { ErrorPage } from '@shared/components'
import { ROUTES } from '@shared/constants'

// Never reveals what the restricted content is, only that access is denied
// (docs/ui-guidelines.md § Error Pages).
export function ForbiddenPage() {
  return (
    <ErrorPage
      title="You don't have access to this page"
      message="If you believe this is a mistake, contact your administrator."
      action={
        <Link
          to={ROUTES.DASHBOARD}
          className="bg-neutral-emphasis text-fg-on-emphasis rounded-md px-4 py-2 text-sm font-medium"
        >
          Back to dashboard
        </Link>
      }
    />
  )
}
