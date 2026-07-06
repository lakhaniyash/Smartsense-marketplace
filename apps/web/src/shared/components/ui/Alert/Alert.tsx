import type { HTMLAttributes, ReactNode } from 'react'
import { DangerIcon, InfoIcon, SuccessIcon, WarningIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: 'border-info-subtle bg-info-subtle text-info-emphasis',
  success: 'border-success-subtle bg-success-subtle text-success-emphasis',
  warning: 'border-warning-subtle bg-warning-subtle text-warning-emphasis',
  danger: 'border-danger-subtle bg-danger-subtle text-danger-emphasis',
}

const VARIANT_ICONS: Record<AlertVariant, ReactNode> = {
  info: <InfoIcon className="size-5 shrink-0" aria-hidden="true" />,
  success: <SuccessIcon className="size-5 shrink-0" aria-hidden="true" />,
  warning: <WarningIcon className="size-5 shrink-0" aria-hidden="true" />,
  danger: <DangerIcon className="size-5 shrink-0" aria-hidden="true" />,
}

// Persistent, page/section-level information — never auto-dismisses (that's
// Toast's job), per docs/ui-guidelines.md § Feedback Components. Color is
// always paired with an icon, never the only signal.
export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-lg border p-4 text-sm',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {VARIANT_ICONS[variant]}
      <div className="flex flex-col gap-1">
        {title !== undefined && <p className="font-medium">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
