import { Outlet } from 'react-router'

// No auth dependency — must render even when bootstrap's auth step failed
// (docs/frontend-architecture.md § Layout Architecture).
export function PublicLayout() {
  return <Outlet />
}
