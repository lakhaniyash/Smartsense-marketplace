import type { ReactNode } from 'react'

interface AuthProviderProps {
  readonly children: ReactNode
}

// Phase 3: Initialize Keycloak, expose auth context via useAuth hook
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}
