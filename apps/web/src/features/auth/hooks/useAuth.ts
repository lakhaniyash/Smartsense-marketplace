import { useContext } from 'react'
import { AuthContext } from '../components/auth-context'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return {
    status: context.status,
    isLoading: context.status === 'loading',
    isAuthenticated: context.status === 'authenticated',
    identity: context.identity,
    login: context.login,
    logout: context.logout,
  }
}
