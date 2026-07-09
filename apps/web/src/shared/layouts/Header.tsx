import type { ReactNode } from 'react'
import { Input, Kbd, NotificationsMenu, ThemeToggle } from '@shared/components'
import { SearchIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface HeaderProps {
  title: string
  subtitle?: string
  onOpenSearch?: () => void
  leading?: ReactNode
  className?: string
}

// Fixed top bar: current context + global actions only — never duplicates
// sidebar navigation, per docs/ui-guidelines.md § Header Behavior. The user
// menu lives in the sidebar footer instead (§ Sidebar Behavior), not here.
// `onOpenSearch` opens the shared Cmd/Ctrl+K command palette
// (app/layouts/AppShell.tsx owns that state) — the search box here is a
// trigger, not a second search implementation.
export function Header({ title, subtitle, onOpenSearch, leading, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'border-border-default bg-surface flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <p className="text-fg-default truncate text-sm font-semibold">{title}</p>
          {subtitle !== undefined && <p className="text-fg-muted truncate text-xs">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onOpenSearch !== undefined && (
          <>
            {/* Icon-only trigger below sm, where the full search box has no room.
                Accessible name is deliberately distinct from a page's own filter
                "Search" field (e.g. Catalog's) — two controls both named plain
                "Search" on the same page is ambiguous for screen reader users. */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search everything (Ctrl+K)"
              className="hover:bg-surface-hover rounded-md p-2 sm:hidden"
            >
              <SearchIcon className="text-fg-muted size-5" aria-hidden="true" />
            </button>
            <div className="relative hidden w-56 sm:block">
              <Input
                readOnly
                placeholder="Search..."
                aria-label="Search everything (Ctrl+K)"
                onClick={onOpenSearch}
                onFocus={onOpenSearch}
                prefixIcon={<SearchIcon className="size-4" aria-hidden="true" />}
                className="cursor-pointer pr-14"
              />
              <Kbd className="pointer-events-none absolute inset-y-0 right-3 my-auto h-fit">
                Ctrl K
              </Kbd>
            </div>
          </>
        )}
        <NotificationsMenu />
        <ThemeToggle />
      </div>
    </header>
  )
}
