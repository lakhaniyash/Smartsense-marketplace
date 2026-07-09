import type { Ref, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { DangerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({
  ref,
  label,
  error,
  helperText,
  id,
  required,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const messageId = `${textareaId}-message`
  const hasMessage = error !== undefined || helperText !== undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={textareaId} className="text-fg-default text-sm font-medium">
          {label}
          {required === true && <span className="text-danger"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          'bg-surface text-fg-default placeholder:text-fg-muted w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          error !== undefined
            ? 'border-danger focus-visible:ring-danger'
            : 'border-border-control focus-visible:ring-focus-ring',
          className,
        )}
        {...props}
      />
      {error !== undefined ? (
        <p id={messageId} className="text-danger flex items-center gap-1 text-sm">
          <DangerIcon className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        helperText !== undefined && (
          <p id={messageId} className="text-fg-muted text-sm">
            {helperText}
          </p>
        )
      )}
    </div>
  )
}
