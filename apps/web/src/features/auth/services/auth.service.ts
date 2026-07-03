import { appConfig } from '@shared/config'
import { logger } from '@shared/services'
import { keycloak } from './keycloak.service'
import type { AuthStatus, AuthenticatedIdentity } from '../types'

type StatusListener = (status: AuthStatus, identity: AuthenticatedIdentity | undefined) => void

let status: AuthStatus = 'loading'
let identity: AuthenticatedIdentity | undefined
let initPromise: Promise<boolean> | undefined
let refreshTimer: ReturnType<typeof setInterval> | undefined

const statusListeners = new Set<StatusListener>()
const logoutListeners = new Set<() => void>()

function parseIdentity(): AuthenticatedIdentity | undefined {
  const { subject, tokenParsed } = keycloak
  if (subject === undefined || tokenParsed === undefined) {
    return undefined
  }
  const claims = tokenParsed as unknown as Record<string, unknown>
  return {
    id: subject,
    email: typeof claims['email'] === 'string' ? claims['email'] : '',
    roles: tokenParsed.realm_access?.roles ?? [],
  }
}

function setStatus(next: AuthStatus): void {
  status = next
  identity = next === 'authenticated' ? parseIdentity() : undefined
  statusListeners.forEach((listener) => listener(status, identity))
}

function stopTokenRefresh(): void {
  if (refreshTimer !== undefined) {
    clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

// Proactive refresh: keycloak-js's updateToken() is a no-op unless the token's
// remaining validity is below `minValidity`, so polling frequently is cheap.
function scheduleTokenRefresh(): void {
  if (refreshTimer !== undefined) {
    return
  }
  refreshTimer = setInterval(() => {
    keycloak.updateToken(appConfig.auth.sessionWarningSeconds).catch(() => {
      logger.warn('Proactive token refresh failed; ending session')
      void logout()
    })
  }, 20_000)
}

function initialize(): Promise<boolean> {
  if (initPromise !== undefined) {
    return initPromise
  }

  keycloak.onAuthSuccess = () => setStatus('authenticated')
  keycloak.onAuthRefreshSuccess = () => setStatus('authenticated')
  keycloak.onAuthLogout = () => setStatus('unauthenticated')
  keycloak.onAuthError = () => setStatus('unauthenticated')
  keycloak.onTokenExpired = () => {
    keycloak.updateToken(-1).catch(() => void logout())
  }

  initPromise = keycloak
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}${appConfig.auth.silentCheckSsoUrl}`,
      pkceMethod: 'S256',
      // Our own updateToken() polling + the Apollo error link's reactive
      // refresh already cover session validity — a second, iframe-based
      // periodic check adds no coverage and is more exposed to third-party
      // cookie restrictions than the one-time check-sso above.
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      setStatus(authenticated ? 'authenticated' : 'unauthenticated')
      if (authenticated) {
        scheduleTokenRefresh()
      }
      return authenticated
    })
    .catch((error: unknown) => {
      logger.error('Keycloak initialization failed', { error })
      setStatus('unauthenticated')
      return false
    })

  return initPromise
}

function subscribe(listener: StatusListener): () => void {
  statusListeners.add(listener)
  listener(status, identity)
  return () => statusListeners.delete(listener)
}

function login(redirectUri?: string): Promise<void> {
  return keycloak.login(redirectUri === undefined ? undefined : { redirectUri })
}

async function logout(): Promise<void> {
  stopTokenRefresh()
  logoutListeners.forEach((listener) => listener())
  setStatus('unauthenticated')
  await keycloak.logout({ redirectUri: appConfig.auth.postLogoutRedirectUri })
}

function onLogout(listener: () => void): () => void {
  logoutListeners.add(listener)
  return () => logoutListeners.delete(listener)
}

function getAccessToken(): string | undefined {
  return keycloak.token
}

function updateToken(minValidity: number): Promise<boolean> {
  return keycloak.updateToken(minValidity)
}

export const authService = {
  initialize,
  subscribe,
  login,
  logout,
  onLogout,
  getAccessToken,
  updateToken,
}
