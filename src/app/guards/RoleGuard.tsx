import type { ReactNode } from 'react'

interface RoleGuardProps {
  readonly roles: readonly string[]
  readonly children: ReactNode
}

// Phase 3: redirect to /forbidden when the user lacks a required role
export function RoleGuard({ children }: RoleGuardProps) {
  return <>{children}</>
}
