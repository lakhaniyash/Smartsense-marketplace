import { DarkThemeIcon, LightThemeIcon, SystemThemeIcon } from '@shared/icons'
import { Button, type ButtonProps } from '../Button'
import { useTheme } from './ThemeProvider'
import type { ThemeMode } from '@shared/services'

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const MODE_ICON: Record<ThemeMode, typeof LightThemeIcon> = {
  light: LightThemeIcon,
  dark: DarkThemeIcon,
  system: SystemThemeIcon,
}

const MODE_LABEL: Record<ThemeMode, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
}

export type ThemeToggleProps = Omit<ButtonProps, 'children' | 'onClick'>

// A single icon button cycles light → dark → system (docs/ui-guidelines.md §
// UI Principles — Simplicity: the plainest control that communicates the
// current state, rather than a three-option menu for a rarely-changed
// setting). The icon and accessible label always reflect the active mode,
// not the resolved light/dark value, so a "system" choice is visibly
// distinct from an explicit "light" choice that happens to match the OS.
export function ThemeToggle({ size = 'sm', variant = 'ghost', ...props }: ThemeToggleProps) {
  const { mode, setMode } = useTheme()
  const Icon = MODE_ICON[mode]
  const label = `Theme: ${MODE_LABEL[mode]}. Click to switch to ${MODE_LABEL[NEXT_MODE[mode]]}.`

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      onClick={() => setMode(NEXT_MODE[mode])}
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  )
}
