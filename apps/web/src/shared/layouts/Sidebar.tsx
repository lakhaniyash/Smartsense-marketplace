import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@shared/utils'

export interface SidebarItem {
  label: string
  href: string
  icon?: ReactNode
}

export interface SidebarProps {
  items: SidebarItem[]
  className?: string
}

// Navigation-only — never page-specific actions, per
// docs/ui-guidelines.md § Sidebar Behavior. Callers pass an already
// permission-filtered `items` list; this component has no auth knowledge
// (shared/ never imports from features/, per CLAUDE.md's Architecture
// Rules), and never a `role === 'Admin'` check.
export function Sidebar({ items, className }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'hidden w-56 shrink-0 border-r border-gray-200 p-4 lg:block dark:border-gray-800',
        className,
      )}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                  isActive && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
