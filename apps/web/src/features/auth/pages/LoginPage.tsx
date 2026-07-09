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
    <div className="bg-canvas flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-fg-default text-3xl font-bold tracking-tight">
          Redirecting to sign in&hellip;
        </h1>
        <p className="text-fg-muted mt-2 text-sm">
          You are being sent to SmartSense Marketplace&apos;s sign-in page.
        </p>
      </div>
    </div>
  )
}
