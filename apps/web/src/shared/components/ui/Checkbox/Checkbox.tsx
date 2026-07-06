import type { InputHTMLAttributes, Ref } from 'react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@shared/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ref?: Ref<HTMLInputElement>
  label?: string
  indeterminate?: boolean
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as { current: T | null }).current = node
      }
    }
  }
}

export function Checkbox({
  ref,
  label,
  indeterminate = false,
  id,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100',
        disabled === true && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        ref={mergeRefs(internalRef, ref)}
        type="checkbox"
        id={checkboxId}
        disabled={disabled}
        className={cn(
          'size-4 shrink-0 rounded border-gray-300 accent-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-not-allowed dark:border-gray-600',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  )
}
