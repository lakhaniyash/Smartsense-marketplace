import type { ReactNode } from 'react'
import * as RadixAccordion from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface AccordionItem {
  value: string
  trigger: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  type?: 'single' | 'multiple'
  className?: string
}

export function Accordion({ items, type = 'single', className }: AccordionProps) {
  const rootProps =
    type === 'single'
      ? { type: 'single' as const, collapsible: true }
      : { type: 'multiple' as const }

  return (
    <RadixAccordion.Root
      {...rootProps}
      className={cn('divide-y divide-gray-200 dark:divide-gray-800', className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value}>
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:text-gray-100 [&[data-state=open]>svg]:rotate-180">
              {item.trigger}
              <ChevronDownIcon
                className="size-4 shrink-0 text-gray-400 transition-transform"
                aria-hidden="true"
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="pb-4 text-sm text-gray-700 dark:text-gray-300">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  )
}
