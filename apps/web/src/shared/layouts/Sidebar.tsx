import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { UserMenu } from '@shared/components'
import { ChevronLeftIcon, ChevronRightIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface SidebarItem {
  label: string
  href: string
  icon?: ReactNode
}

export interface SidebarProps {
  items: SidebarItem[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  userLabel?: string | undefined
  userInitials?: string
  roleLabel?: string | undefined
  onLogout?: () => void
  className?: string
}

// Navigation-only apart from the account footer below — never page-specific
// actions, per docs/ui-guidelines.md § Sidebar Behavior. Callers pass an
// already permission-filtered `items` list; this component has no auth
// knowledge of its own (shared/ never imports from features/, per
// CLAUDE.md's Architecture Rules) — `userLabel`/`userInitials`/`onLogout`
// arrive as plain props/callbacks from app/layouts/AppShell.tsx, same
// pattern as the nav items themselves, and never a `role === 'Admin'` check.
//
// `onToggleCollapse` is only passed by the persistent desktop instance
// (app/layouts/AppShell.tsx) — the mobile Drawer renders a second Sidebar
// instance without it, since a drawer the user can already dismiss has no
// use for a collapse control. The account footer (`UserMenu`), by contrast,
// is passed to *both* instances, so logging out is always reachable — on
// mobile that means one tap into the nav drawer instead of a persistent
// header control. When collapsed, a label is still available to assistive
// tech (`aria-label`) and on hover (`title`) even though it's visually
// hidden — an icon-only nav item (or account button) is never unlabeled,
// per docs/ui-guidelines.md § Accessibility (ARIA Usage).
export function Sidebar({
  items,
  collapsed = false,
  onToggleCollapse,
  userLabel,
  userInitials,
  roleLabel,
  onLogout,
  className,
}: SidebarProps) {
  const hasUserMenu =
    userLabel !== undefined && userInitials !== undefined && onLogout !== undefined
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'border-border-default hidden shrink-0 flex-col border-r p-4 transition-[width] lg:flex',
        collapsed ? 'w-16' : 'w-56',
        className,
      )}
    >
      <ul className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'text-fg-secondary hover:bg-surface-hover flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                  collapsed && 'justify-center',
                  isActive && 'bg-surface-hover text-fg-default',
                )
              }
            >
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      {(hasUserMenu || onToggleCollapse !== undefined) && (
        <div className="border-border-default flex flex-col gap-1 border-t pt-2">
          {userLabel !== undefined && userInitials !== undefined && onLogout !== undefined && (
            <UserMenu
              userLabel={userLabel}
              userInitials={userInitials}
              roleLabel={roleLabel}
              onLogout={onLogout}
              collapsed={collapsed}
            />
          )}
          {onToggleCollapse !== undefined && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'text-fg-muted hover:bg-surface-hover hover:text-fg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                collapsed && 'justify-center',
              )}
            >
              {collapsed ? (
                <ChevronRightIcon className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <>
                  <ChevronLeftIcon className="size-4 shrink-0" aria-hidden="true" />
                  Collapse
                </>
              )}
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
