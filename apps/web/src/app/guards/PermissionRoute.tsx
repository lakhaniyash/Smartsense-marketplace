import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth, usePermissions } from '@features/auth'
import { AppLoadingState } from '@shared/components'
import { ROUTES } from '@shared/constants'

interface PermissionRouteProps {
  permission: string | string[]
}

// Authentication + capability guard — see docs/authorization.md § Frontend
// Authorization. This is a UX mirror only; the backend re-enforces every
// permission from scratch regardless of what this guard decided.
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { canAll, isLoading: isPermissionsLoading } = usePermissions()
  const location = useLocation()

  if (isAuthLoading || (isAuthenticated && isPermissionsLoading)) {
    return <AppLoadingState />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission]
  if (!canAll(requiredPermissions)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}
