import { useEffect } from 'react'
import { useLocation, type Location } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// Redirect-only per docs/authentication.md § Frontend Auth Feature
// Responsibilities — Keycloak owns the actual credential form; this page's
// only job is to kick off the Authorization Code + PKCE redirect and
// preserve the route the user originally requested.
export function LoginPage() {
  const { status, login } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return
    }
    const from = (location.state as { from?: Location } | null)?.from
    const redirectUri = from ? `${window.location.origin}${from.pathname}${from.search}` : undefined
    void login(redirectUri)
  }, [status, login, location.state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Redirecting to sign in&hellip;
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          You are being sent to SmartSense Marketplace&apos;s sign-in page.
        </p>
      </div>
    </div>
  )
}
