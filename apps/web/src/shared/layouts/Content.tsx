import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { cn } from '@shared/utils'
import { BreadcrumbProvider, Breadcrumbs } from './Breadcrumbs'

export interface ContentProps {
  children?: ReactNode
  className?: string
}

// The main content region of an authenticated shell — renders the
// route-derived breadcrumb trail (Breadcrumbs.tsx) above the routed page's
// own content, so no page has to render its own breadcrumb. Renders the
// routed page via <Outlet/> by default, or explicit children for
// non-router usage (e.g. Storybook, where BreadcrumbProvider/Breadcrumbs'
// react-router hooks would have no router to read from).
export function Content({ children, className }: ContentProps) {
  return (
    <main className={cn('flex-1 p-6', className)}>
      {children ?? (
        <BreadcrumbProvider>
          <Breadcrumbs />
          <Outlet />
        </BreadcrumbProvider>
      )}
    </main>
  )
}
