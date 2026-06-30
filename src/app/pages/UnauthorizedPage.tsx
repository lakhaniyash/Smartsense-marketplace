import { Link } from 'react-router'
import { ROUTES } from '@shared/constants'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm font-medium text-yellow-600">401</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Unauthorized</h1>
        <p className="mt-4 text-base text-gray-500">You must be signed in to access this page.</p>
        <div className="mt-8">
          <Link to={ROUTES.LOGIN} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
