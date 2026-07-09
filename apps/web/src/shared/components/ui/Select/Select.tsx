import type { Ref, SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { ChevronDownIcon, DangerIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  ref?: Ref<HTMLSelectElement>
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  // Default (false): the placeholder is disabled — correct for a required
  // form field, where "no selection" must never be the end state a user
  // lands back on. Set true for a filter/search Select, where the
  // placeholder IS a real, meaningful, re-selectable state ("All statuses" /
  // clear this filter) — a disabled <option> can never be reselected once
  // the user has picked something else, which would otherwise trap a filter
  // permanently on its last non-empty value.
  clearable?: boolean
}

// Native <select> per docs/ui-guidelines.md's ARIA Usage rule ("use the
// native element... except where no native element fits") — a single-select
// dropdown of simple options is exactly the case the native element fits.
export function Select({
  ref,
  label,
  error,
  helperText,
  options,
  placeholder,
  clearable = false,
  id,
  required,
  className,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const messageId = `${selectId}-message`
  const hasMessage = error !== undefined || helperText !== undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={selectId} className="text-fg-default text-sm font-medium">
          {label}
          {required === true && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'bg-surface text-fg-default h-10 w-full appearance-none rounded-md border px-3 pr-9 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
            error !== undefined
              ? 'border-danger focus-visible:ring-danger'
              : 'border-border-control focus-visible:ring-focus-ring',
            className,
          )}
          {...props}
        >
          {placeholder !== undefined && (
            <option value="" disabled={!clearable} hidden={!clearable}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="text-fg-muted pointer-events-none absolute inset-y-0 right-3 my-auto size-4"
          aria-hidden="true"
        />
      </div>
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
