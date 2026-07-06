import type { ReactNode } from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'

export interface TabItem {
  value: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

// Switches between views of the same entity/context — never a substitute
// for top-level navigation between modules, per docs/ui-guidelines.md
// § Navigation (Tabs).
export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  const resolvedDefaultValue = defaultValue ?? items[0]?.value
  const rootProps = {
    ...(resolvedDefaultValue !== undefined && { defaultValue: resolvedDefaultValue }),
    ...(value !== undefined && { value }),
    ...(onValueChange !== undefined && { onValueChange }),
    ...(className !== undefined && { className }),
  }

  return (
    <RadixTabs.Root {...rootProps}>
      <RadixTabs.List className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 dark:hover:text-gray-300 dark:data-[state=active]:border-gray-100 dark:data-[state=active]:text-gray-100"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-4">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
