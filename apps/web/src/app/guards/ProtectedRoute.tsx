import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@features/auth'
import { AppLoadingState } from '@shared/components'
import { ROUTES } from '@shared/constants'

// Authentication-only guard — see docs/authentication.md § Route Protection.
// Renders the app-level loading state while auth is still bootstrapping so
// the app never flashes a guessed redirect.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AppLoadingState />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
