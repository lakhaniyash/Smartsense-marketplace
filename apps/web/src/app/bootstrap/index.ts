import { authService } from '@features/auth'

// One-time startup logic, per docs/folder-structure.md § app — Application
// Shell. AuthProvider also calls authService.initialize() so React state
// stays in sync regardless of mount order; the call is idempotent (a single
// cached init promise), so triggering it here as well costs nothing and
// lets a future non-React entry point (e.g. a service worker) bootstrap
// auth without depending on the component tree.
export function bootstrapApp(): Promise<boolean> {
  return authService.initialize()
}
