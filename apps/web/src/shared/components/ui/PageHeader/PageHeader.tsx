import type { ReactNode } from 'react'
import { cn } from '@shared/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: ReactNode
  action?: ReactNode
  className?: string
}

// One page title, one optional primary action — a page with several
// equally-weighted actions belongs in a toolbar instead, per
// docs/ui-guidelines.md § Page Layouts.
export function PageHeader({ title, description, breadcrumb, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-gray-800',
        className,
      )}
    >
      {breadcrumb}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {description !== undefined && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action !== undefined && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
