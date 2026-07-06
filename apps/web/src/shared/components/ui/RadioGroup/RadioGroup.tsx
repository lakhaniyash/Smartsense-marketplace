import type { ReactNode } from 'react'
import { createContext, useContext, useId } from 'react'

interface RadioGroupContextValue {
  name: string
  value: string | undefined
  onChange: ((value: string) => void) | undefined
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export function useRadioGroupContext() {
  const context = useContext(RadioGroupContext)
  if (!context) {
    throw new Error('Radio must be rendered inside a RadioGroup')
  }
  return context
}

export interface RadioGroupProps {
  name?: string
  label: string
  value?: string
  onChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function RadioGroup({ name, label, value, onChange, children, className }: RadioGroupProps) {
  const generatedName = useId()

  return (
    <fieldset className={className}>
      <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</legend>
      <div className="mt-2 flex flex-col gap-2">
        <RadioGroupContext.Provider value={{ name: name ?? generatedName, value, onChange }}>
          {children}
        </RadioGroupContext.Provider>
      </div>
    </fieldset>
  )
}
