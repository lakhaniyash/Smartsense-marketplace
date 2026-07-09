import { ChevronDownIcon, LogOutIcon } from '@shared/icons'
import { Avatar } from '../Avatar'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '../Menu'

export interface UserMenuProps {
  userLabel: string
  userInitials: string
  roleLabel?: string | undefined
  onLogout: () => void
  collapsed?: boolean
}

// The sidebar's user menu (docs/ui-guidelines.md § Design System — Menus:
// "the header's user menu" — relocated to the sidebar footer, see § Sidebar
// Behavior for why). Identity display plus the one action that actually
// exists today (Log out) — no "Profile"/"Settings" entry, since those pages
// don't exist yet and a menu item that goes nowhere is worse than no menu
// item at all.
//
// `collapsed` mirrors the sidebar's own collapsed state (SidebarProps):
// expanded shows a full account row (avatar, name, role, chevron) matching
// the nav items' row treatment; collapsed shrinks to an icon-only avatar
// button, same accessible-name-preserved pattern the nav items use.
export function UserMenu({
  userLabel,
  userInitials,
  roleLabel,
  onLogout,
  collapsed = false,
}: UserMenuProps) {
  return (
    <Menu
      align="start"
      trigger={
        collapsed ? (
          <button
            type="button"
            className="hover:bg-surface-hover focus-visible:outline-focus-ring flex items-center justify-center rounded-md p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Account menu for ${userLabel}`}
            title={`Account menu for ${userLabel}`}
          >
            <Avatar initials={userInitials} size="sm" />
          </button>
        ) : (
          <button
            type="button"
            className="hover:bg-surface-hover focus-visible:outline-focus-ring flex w-full items-center gap-2 rounded-md p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Account menu for ${userLabel}`}
          >
            <Avatar initials={userInitials} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg-default truncate text-sm font-medium">{userLabel}</span>
              {roleLabel !== undefined && (
                <span className="text-fg-muted truncate text-xs">{roleLabel}</span>
              )}
            </span>
            <ChevronDownIcon className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
          </button>
        )
      }
      className="w-64"
    >
      <MenuLabel>
        <span className="text-fg-default block truncate text-sm font-medium">{userLabel}</span>
        {roleLabel !== undefined && (
          <span className="text-fg-muted block truncate text-xs">{roleLabel}</span>
        )}
      </MenuLabel>
      <MenuSeparator />
      <MenuItem
        icon={<LogOutIcon className="size-4" aria-hidden="true" />}
        onSelect={onLogout}
        variant="danger"
      >
        Log out
      </MenuItem>
    </Menu>
  )
}
