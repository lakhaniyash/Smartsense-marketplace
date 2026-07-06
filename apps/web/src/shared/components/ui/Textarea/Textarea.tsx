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
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
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
          'w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100',
          error !== undefined
            ? 'border-danger focus-visible:ring-danger'
            : 'border-gray-300 focus-visible:ring-gray-400 dark:border-gray-700',
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
          <p id={messageId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )
      )}
    </div>
  )
}
