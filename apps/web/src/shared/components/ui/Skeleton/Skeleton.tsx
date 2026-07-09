import type { HTMLAttributes } from 'react'
import { cn } from '@shared/utils'

// Purely decorative — hidden from assistive tech, per
// docs/ui-guidelines.md § Loading Experience (Skeletons).
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      // gray-200/gray-800 has no exact token match; bg-surface-hover is the
      // closest role-match (shares the dark:gray-800 value, nearest light-mode
      // weight among the surface tokens).
      className={cn('bg-surface-hover animate-pulse rounded-md', className)}
      {...props}
    />
  )
}
