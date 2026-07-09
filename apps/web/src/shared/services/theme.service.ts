export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

// Keep in sync with the inline bootstrap script in apps/web/index.html —
// that script re-implements this same read + resolve logic because it must
// run before any JS module loads (synchronously, pre-paint) to set the
// `dark` class before React mounts and avoid a flash of the wrong theme.
const STORAGE_KEY = 'smartsense-theme'
const DARK_CLASS = 'dark'

function readStoredMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null
  } catch {
    // Storage can throw in private-browsing/locked-down contexts — falling
    // back to "no stored preference" is correct, not an error to surface.
    return null
  }
}

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemPreference() : mode
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle(DARK_CLASS, resolved === 'dark')
}

// Theme toggle + persistence, centralized here per docs/ui-guidelines.md §
// Dark Mode ("The theme toggle and persistence mechanism belong in
// apps/web/src/shared/services... following the same centralized service,
// not scattered direct access pattern already established for configuration
// access") rather than components touching localStorage/matchMedia directly.
export const themeService = {
  getInitialMode(): ThemeMode {
    return readStoredMode() ?? 'system'
  },

  resolveTheme,

  apply(mode: ThemeMode): ResolvedTheme {
    const resolved = resolveTheme(mode)
    applyResolvedTheme(resolved)
    return resolved
  },

  persist(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Persistence is a convenience; a storage exception must not block
      // the theme itself from applying.
    }
  },

  onSystemPreferenceChange(callback: (resolved: ResolvedTheme) => void): () => void {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent): void => {
      callback(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  },
}
