import { createContext } from 'react'
import type { AuthStatus, AuthenticatedIdentity } from '../types'

export interface AuthContextValue {
  status: AuthStatus
  identity: AuthenticatedIdentity | undefined
  login: (redirectUri?: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
