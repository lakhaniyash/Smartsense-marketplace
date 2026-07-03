import { useEffect, useState, type ReactNode } from 'react'
import { authService } from '../services'
import type { AuthStatus, AuthenticatedIdentity } from '../types'
import { AuthContext, type AuthContextValue } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [identity, setIdentity] = useState<AuthenticatedIdentity | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = authService.subscribe((nextStatus, nextIdentity) => {
      setStatus(nextStatus)
      setIdentity(nextIdentity)
    })
    void authService.initialize()
    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    status,
    identity,
    login: authService.login,
    logout: authService.logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
