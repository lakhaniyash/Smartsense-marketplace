import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { SpinnerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring',
  secondary:
    'border border-border-control bg-surface text-fg-secondary hover:bg-surface-subtle focus-visible:outline-focus-ring',
  ghost: 'text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring',
  danger: 'bg-danger text-white hover:bg-danger-emphasis focus-visible:outline-danger',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-base',
}

// Icon-only usage requires the consumer to pass an accessible name via
// `aria-label` (docs/ui-guidelines.md § Buttons — "an icon-only button always
// has an accessible label"); this component has no way to enforce that
// statically.
export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? isLoading

  return (
    <button
      type="button"
      aria-busy={isLoading || undefined}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <SpinnerIcon className="size-4 animate-spin" aria-hidden="true" /> : leadingIcon}
      {children}
      {!isLoading && trailingIcon}
    </button>
  )
}
