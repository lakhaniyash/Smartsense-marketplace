import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@shared/utils'
import { useRadioGroupContext } from './RadioGroup'

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'name' | 'checked' | 'onChange'
> {
  value: string
  label: string
}

export function Radio({ value, label, id, className, disabled, ...props }: RadioProps) {
  const { name, value: groupValue, onChange } = useRadioGroupContext()
  const generatedId = useId()
  const radioId = id ?? generatedId

  return (
    <label
      htmlFor={radioId}
      className={cn(
        'text-fg-default inline-flex items-center gap-2 text-sm',
        disabled === true && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={groupValue === value}
        onChange={() => onChange?.(value)}
        disabled={disabled}
        className={cn(
          // Checked fill uses the inverted high-contrast treatment (same as Button primary).
          'border-border-control accent-neutral-emphasis focus-visible:outline-focus-ring size-4 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  )
}
