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
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to dashboard
        </Link>
      }
    />
  )
}
