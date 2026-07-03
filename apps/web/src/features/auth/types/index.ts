export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthenticatedIdentity {
  id: string
  email: string
  roles: string[]
}
