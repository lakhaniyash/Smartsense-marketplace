import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@features/auth'
import { AppLoadingState } from '@shared/components'
import { ROUTES } from '@shared/constants'

// Inverse guard — prevents an already-authenticated user from re-seeing the
// login form via back-navigation (docs/authentication.md § Route Protection).
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AppLoadingState />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
