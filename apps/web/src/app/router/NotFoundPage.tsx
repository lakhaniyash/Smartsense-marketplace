import { Link } from 'react-router'
import { ErrorPage } from '@shared/components'
import { ROUTES } from '@shared/constants'

export function NotFoundPage() {
  return (
    <ErrorPage
      title="Page not found"
      message="The page you're looking for doesn't exist."
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
