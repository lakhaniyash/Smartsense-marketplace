import type { ReactNode } from 'react'
import { EmptyIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

// Every list/data view gets this instead of a bare area — icon + headline +
// one sentence + optional action, per docs/ui-guidelines.md § Empty States.
// The "No Data" / "No Search Results" / "First Time User" variants are the
// same component with different copy/action, not separate components.
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="text-gray-400" aria-hidden="true">
        {icon ?? <EmptyIcon className="size-10" />}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
      {description !== undefined && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  )
}
