import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import {
  DarkThemeIcon,
  LightThemeIcon,
  LogOutIcon,
  SearchIcon,
  SystemThemeIcon,
} from '@shared/icons'
import { useTheme } from '../ThemeToggle'
import { Kbd } from '../Kbd'

export interface CommandPaletteNavItem {
  label: string
  href: string
  icon?: ReactNode
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navItems: CommandPaletteNavItem[]
  onLogout?: (() => void) | undefined
}

// The header's search box and the Ctrl/Cmd+K shortcut both open this same
// instance (docs/ui-guidelines.md's Search row already anticipated "header
// for a possible future global search"). It only navigates between pages
// this app already has and toggles app-shell state (theme) — it never
// searches business data (products/orders/etc.), which stays the owning
// feature's job (e.g. the Catalog page's own filter bar). Built on `cmdk`
// rather than hand-rolled, since a searchable, keyboard-navigable list is
// exactly the ARIA/keyboard behavior docs/ui-guidelines.md's Anti-Patterns
// section says never to reimplement by hand.
export function CommandPalette({ open, onOpenChange, navItems, onLogout }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { setMode } = useTheme()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  function runAndClose(action: () => void) {
    action()
    onOpenChange(false)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      overlayClassName="fixed inset-0 z-overlay bg-overlay/50"
      contentClassName="fixed top-[20%] left-1/2 z-modal w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg bg-surface shadow-xl"
    >
      <div className="border-border-default flex items-center gap-2 border-b px-4">
        <SearchIcon className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          placeholder="Search pages and actions..."
          className="text-fg-default placeholder:text-fg-muted h-12 w-full bg-transparent text-sm outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="text-fg-muted px-2 py-6 text-center text-sm">
          No matching page or action.
        </Command.Empty>
        <Command.Group
          heading="Navigate"
          className="text-fg-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
        >
          {navItems.map((item) => (
            <Command.Item
              key={item.href}
              value={item.label}
              onSelect={() => runAndClose(() => navigate(item.href))}
              className="text-fg-secondary data-[selected=true]:bg-surface-hover data-[selected=true]:text-fg-default flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
            >
              {item.icon}
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Separator className="bg-border-default my-2 h-px" />
        <Command.Group
          heading="Actions"
          className="text-fg-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
        >
          <Command.Item
            value="Switch to light theme"
            onSelect={() => runAndClose(() => setMode('light'))}
            className="text-fg-secondary data-[selected=true]:bg-surface-hover data-[selected=true]:text-fg-default flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
          >
            <LightThemeIcon className="size-4" aria-hidden="true" />
            Switch to light theme
          </Command.Item>
          <Command.Item
            value="Switch to dark theme"
            onSelect={() => runAndClose(() => setMode('dark'))}
            className="text-fg-secondary data-[selected=true]:bg-surface-hover data-[selected=true]:text-fg-default flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
          >
            <DarkThemeIcon className="size-4" aria-hidden="true" />
            Switch to dark theme
          </Command.Item>
          <Command.Item
            value="Match system theme"
            onSelect={() => runAndClose(() => setMode('system'))}
            className="text-fg-secondary data-[selected=true]:bg-surface-hover data-[selected=true]:text-fg-default flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
          >
            <SystemThemeIcon className="size-4" aria-hidden="true" />
            Match system theme
          </Command.Item>
          {onLogout !== undefined && (
            <Command.Item
              value="Log out"
              onSelect={() => runAndClose(onLogout)}
              className="text-danger data-[selected=true]:bg-surface-hover flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
            >
              <LogOutIcon className="size-4" aria-hidden="true" />
              Log out
            </Command.Item>
          )}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
