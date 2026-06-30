import type { ReactNode } from 'react'

interface ThemeProviderProps {
  readonly children: ReactNode
}

// Phase 6+: Manages light/dark color scheme and exposes useTheme context
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}
