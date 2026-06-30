export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: string[]
}
