import { ErrorPage } from '@shared/components'
import { useAuth } from '../hooks/useAuth'

// Reached when the SPA still believed it had a session but a request came
// back UNAUTHENTICATED (docs/authentication.md § Route Protection) — tone is
// neutral, this is an expected occurrence, not a fault.
export function UnauthorizedPage() {
  const { login } = useAuth()

  return (
    <ErrorPage
      title="Your session has expired"
      message="Sign in again to continue where you left off."
      action={
        <button
          type="button"
          onClick={() => void login()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      }
    />
  )
}
