import { Outlet } from 'react-router'

// Phase 3: redirect authenticated users to /dashboard
export function PublicGuard() {
  return <Outlet />
}
