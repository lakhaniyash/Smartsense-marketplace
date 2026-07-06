import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { useId } from 'react'
import { DangerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
  label?: string
  error?: string
  helperText?: string
  prefixIcon?: ReactNode
  suffixIcon?: ReactNode
}

// Placeholder is never a label substitute (docs/ui-guidelines.md § Labels);
// `label` is a real prop, not left to the consumer to remember to wrap.
export function Input({
  ref,
  label,
  error,
  helperText,
  prefixIcon,
  suffixIcon,
  id,
  required,
  className,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasMessage = error !== undefined || helperText !== undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
          {required === true && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        {prefixIcon !== undefined && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {prefixIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'h-10 w-full rounded-md border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100',
            error !== undefined
              ? 'border-danger focus-visible:ring-danger'
              : 'border-gray-300 focus-visible:ring-gray-400 dark:border-gray-700',
            prefixIcon !== undefined && 'pl-9',
            suffixIcon !== undefined && 'pr-9',
            className,
          )}
          {...props}
        />
        {suffixIcon !== undefined && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {suffixIcon}
          </span>
        )}
      </div>
      {error !== undefined ? (
        <p id={messageId} className="text-danger flex items-center gap-1 text-sm">
          <DangerIcon className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        helperText !== undefined && (
          <p id={messageId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )
      )}
    </div>
  )
}
