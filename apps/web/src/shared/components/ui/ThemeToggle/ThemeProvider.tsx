import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { themeService, type ResolvedTheme, type ThemeMode } from '@shared/services'

interface ThemeContextValue {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Wires themeService (persistence + system-preference detection) into React
// state — the service owns the actual localStorage/matchMedia/DOM-class
// logic (docs/ui-guidelines.md § Dark Mode), this component only re-renders
// consumers when the resolved theme changes. apps/web/index.html applies the
// same resolved class synchronously before this component ever mounts, so
// there is no flash of the wrong theme during the initial render.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => themeService.getInitialMode())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    themeService.resolveTheme(mode),
  )

  useEffect(() => {
    setResolvedTheme(themeService.apply(mode))

    if (mode !== 'system') {
      return undefined
    }
    // Only "system" mode tracks live OS-level changes — an explicit
    // light/dark choice is a deliberate override that a later OS theme
    // change must not silently undo.
    return themeService.onSystemPreferenceChange(setResolvedTheme)
  }, [mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    themeService.persist(nextMode)
    setModeState(nextMode)
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
