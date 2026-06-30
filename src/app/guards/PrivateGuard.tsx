import { Outlet } from 'react-router'

// Phase 3: redirect unauthenticated users to /login
export function PrivateGuard() {
  return <Outlet />
}
