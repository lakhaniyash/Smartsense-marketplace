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
export function AppLayout({ header, sidebar, children, className }: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950', className)}>
      {header}
      <div className="flex flex-1">
        {sidebar}
        {children}
      </div>
    </div>
  )
}
