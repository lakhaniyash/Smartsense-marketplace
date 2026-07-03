import { Observable } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { authService } from '@features/auth'
import { logger } from '@shared/services'

interface RetryContext {
  hasRetriedAfterRefresh?: boolean
}

function isUnauthenticated(extensions: Record<string, unknown> | undefined): boolean {
  return extensions?.['code'] === 'UNAUTHENTICATED'
}

// Cross-cutting session reaction, per docs/authentication.md § Silent
// Refresh & Token Refresh Strategy (reactive path) and § GraphQL
// Authentication. FORBIDDEN is deliberately left untouched here — it never
// tears down the session (docs/authorization.md § Authentication vs
// Authorization); it is handled by the calling hook/page instead.
export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (networkError) {
    logger.error('GraphQL network error', { message: networkError.message })
    return undefined
  }

  const hasExpiredSession = graphQLErrors?.some((error) =>
    isUnauthenticated(error.extensions as Record<string, unknown> | undefined),
  )
  if (hasExpiredSession !== true) {
    return undefined
  }

  const context = operation.getContext() as RetryContext
  if (context.hasRetriedAfterRefresh === true) {
    void authService.logout()
    return undefined
  }

  return new Observable((observer) => {
    authService
      .updateToken(-1)
      .then((refreshed) => {
        if (!refreshed) {
          void authService.logout()
          observer.error(new Error('Session expired'))
          return
        }
        operation.setContext({ hasRetriedAfterRefresh: true })
        forward(operation).subscribe(observer)
      })
      .catch(() => {
        void authService.logout()
        observer.error(new Error('Session expired'))
      })
  })
})
