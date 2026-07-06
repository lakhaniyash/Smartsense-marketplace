import type { ReactNode } from 'react'
import { DangerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

// Inline/section-level failure (a failed dashboard card, a failed list
// fetch) — distinct from the full-page ErrorPage (401/403/404/500 chrome),
// per the four-state model in docs/architecture.md § Loading Strategy.
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <DangerIcon className="text-danger size-10" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  )
}
