import type { ReactNode } from 'react'
import { cn } from '@shared/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

// One page title, one optional primary action — a page with several
// equally-weighted actions belongs in a toolbar instead, per
// docs/ui-guidelines.md § Page Layouts. Breadcrumbs are no longer a prop
// here — the shell renders them once, automatically, above this component
// (shared/layouts/Breadcrumbs.tsx), derived from route metadata.
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('border-border-default flex flex-col gap-4 border-b pb-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-fg-default text-3xl font-bold tracking-tight">{title}</h1>
          {description !== undefined && <p className="text-fg-muted mt-1 text-sm">{description}</p>}
        </div>
        {action !== undefined && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
