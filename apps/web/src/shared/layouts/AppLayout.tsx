import type { ReactNode } from 'react'
import { cn } from '@shared/utils'

export interface AppLayoutProps {
  header: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  className?: string
}

// The authenticated shell shape: Header on top, optional Sidebar + main
// content below — Admin/Partner/Customer layouts are three configurations
// of this, not three implementations (docs/frontend-architecture.md
// § Layout Architecture).
//
// Pinned to exactly the viewport height (`h-screen overflow-hidden`), not
// `min-h-screen` — the shell itself never scrolls. Header and Sidebar stay
// visible regardless of how tall a routed page's content is; `Content`
// (shared/layouts/Content.tsx) is the one scrolling region, per
// docs/ui-guidelines.md's "Header: fixed to the top of the viewport."
export function AppLayout({ header, sidebar, children, className }: AppLayoutProps) {
  return (
    <div className={cn('bg-canvas flex h-screen flex-col overflow-hidden', className)}>
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        {children}
      </div>
    </div>
  )
}
