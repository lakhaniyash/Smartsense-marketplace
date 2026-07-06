import type { ReactNode } from 'react'
import { Avatar, Button } from '@shared/components'
import { LogOutIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface HeaderProps {
  title: string
  subtitle?: string
  userLabel?: string | undefined
  userInitials?: string
  onLogout?: () => void
  leading?: ReactNode
  className?: string
}

// Fixed top bar: current context + user menu only — never duplicates
// sidebar navigation, per docs/ui-guidelines.md § Header Behavior.
export function Header({
  title,
  subtitle,
  userLabel,
  userInitials,
  onLogout,
  leading,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {leading}
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
          {subtitle !== undefined && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {userLabel !== undefined && (
          <div className="flex items-center gap-2">
            {userInitials !== undefined && <Avatar initials={userInitials} size="sm" />}
            <span className="text-sm text-gray-500">{userLabel}</span>
          </div>
        )}
        {onLogout !== undefined && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            leadingIcon={<LogOutIcon className="size-4" aria-hidden="true" />}
          >
            Log out
          </Button>
        )}
      </div>
    </header>
  )
}
