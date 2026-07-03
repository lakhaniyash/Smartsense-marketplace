import { setContext } from '@apollo/client/link/context'
import { authService } from '@features/auth'

// Attaches the current access token to every GraphQL request. The frontend
// auth feature's service is the only source of the token — see
// docs/authentication.md § Session Management.
export const authLink = setContext((_operation, previousContext) => {
  const token = authService.getAccessToken()
  const previousHeaders = (previousContext['headers'] ?? {}) as Record<string, string>

  return {
    headers: {
      ...previousHeaders,
      ...(token !== undefined && { Authorization: `Bearer ${token}` }),
    },
  }
})
