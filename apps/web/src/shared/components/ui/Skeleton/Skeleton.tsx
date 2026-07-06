import type { HTMLAttributes } from 'react'
import { cn } from '@shared/utils'

// Purely decorative — hidden from assistive tech, per
// docs/ui-guidelines.md § Loading Experience (Skeletons).
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)}
      {...props}
    />
  )
}
