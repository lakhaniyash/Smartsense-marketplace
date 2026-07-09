import type { HTMLAttributes } from 'react'
import { cn } from '@shared/utils'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

// One semantic color per status family (docs/ui-guidelines.md § Color
// Philosophy) — the same variant reads as the same status everywhere it's
// used, whether on a Badge, an Alert, or a Button.
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-subtle text-fg-secondary',
  success: 'bg-success-subtle text-success-emphasis',
  warning: 'bg-warning-subtle text-warning-emphasis',
  danger: 'bg-danger-subtle text-danger-emphasis',
  info: 'bg-info-subtle text-info-emphasis',
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}
