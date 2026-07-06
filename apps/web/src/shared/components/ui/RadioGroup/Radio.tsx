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
        'inline-flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100',
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
          'size-4 shrink-0 border-gray-300 accent-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-not-allowed dark:border-gray-600',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  )
}
