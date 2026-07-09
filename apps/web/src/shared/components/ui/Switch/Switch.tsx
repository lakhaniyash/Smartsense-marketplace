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
        'text-fg-default inline-flex items-center gap-2 text-sm',
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
            // Unchecked track needs a visibly filled "off" state, not just a
            // recessed surface (bg-surface-subtle reads as near-white against
            // a white page in light mode) — reusing border-control's value as
            // a background gives a clearly visible track, same as the
            // pre-token `bg-gray-200 dark:bg-gray-700` it replaces. Checked
            // uses the inverted high-contrast fill (same "active" treatment
            // as Button primary/Checkbox).
            'peer border-border-control bg-border-control checked:border-neutral-emphasis checked:bg-neutral-emphasis focus-visible:outline-focus-ring absolute inset-0 size-full cursor-pointer appearance-none rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        <span
          aria-hidden="true"
          className="bg-surface pointer-events-none absolute left-0.5 size-4 translate-x-0 rounded-full shadow transition-transform peer-checked:translate-x-4"
        />
      </span>
      {label}
    </label>
  )
}
