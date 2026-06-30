import { Link } from 'react-router'
import { ROUTES } from '@shared/constants'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-600">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Page not found</h1>
        <p className="mt-4 text-base text-gray-500">The page you are looking for does not exist.</p>
        <div className="mt-8">
          <Link to={ROUTES.LOGIN} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  )
}
