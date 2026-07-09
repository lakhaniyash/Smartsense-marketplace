import type { HTMLAttributes } from 'react'
import { SpinnerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string
}

// Reserved for action-scoped/unpredictable-shape loading, never a full
// page's initial load (that's a Skeleton's job) — docs/ui-guidelines.md
// § Loading Experience (Spinners).
export function Spinner({ label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      <SpinnerIcon className="text-fg-muted size-4 animate-spin" aria-hidden="true" />
    </span>
  )
}
