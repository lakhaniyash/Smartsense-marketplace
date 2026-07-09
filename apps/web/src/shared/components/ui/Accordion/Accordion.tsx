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
    <RadixAccordion.Root {...rootProps} className={cn('divide-border-default divide-y', className)}>
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value}>
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="text-fg-default focus-visible:outline-focus-ring flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 [&[data-state=open]>svg]:rotate-180">
              {item.trigger}
              <ChevronDownIcon
                className="text-fg-muted size-4 shrink-0 transition-transform"
                aria-hidden="true"
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="text-fg-secondary pb-4 text-sm">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  )
}
