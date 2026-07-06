import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { cn } from '@shared/utils'

export interface ContentProps {
  children?: ReactNode
  className?: string
}

// The main content region of an authenticated shell — renders the routed
// page via <Outlet/> by default, or explicit children for non-router usage
// (e.g. Storybook).
export function Content({ children, className }: ContentProps) {
  return <main className={cn('flex-1 p-6', className)}>{children ?? <Outlet />}</main>
}
