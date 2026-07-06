import type { InputHTMLAttributes, Ref } from 'react'
import { useId } from 'react'
import { cn } from '@shared/utils'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ref?: Ref<HTMLInputElement>
  label?: string
}

// A styled native checkbox, not a hand-rolled ARIA widget — `role="switch"`
// only changes the announced semantics; keyboard/checked behavior stays
// native, per docs/ui-guidelines.md's ARIA Usage rule.
export function Switch({ ref, label, id, className, disabled, ...props }: SwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100',
        disabled === true && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={switchId}
          disabled={disabled}
          className={cn(
            'peer absolute inset-0 size-full cursor-pointer appearance-none rounded-full border border-gray-300 bg-gray-200 transition-colors checked:border-gray-900 checked:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:checked:border-gray-100 dark:checked:bg-gray-100',
            className,
          )}
          {...props}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 size-4 translate-x-0 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 dark:bg-gray-900"
        />
      </span>
      {label}
    </label>
  )
}
