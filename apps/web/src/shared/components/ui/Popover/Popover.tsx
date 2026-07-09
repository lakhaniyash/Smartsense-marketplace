import type { ReactNode } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { cn } from '@shared/utils'

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

// A floating content panel anchored to a trigger — distinct from Menu (a
// list of actionable commands, role="menu") in that its content is passive
// (e.g. the header's notifications panel), so it uses the correct ARIA
// role rather than mislabeling non-actionable content as a menu.
export function Popover({ trigger, children, align = 'end', className }: PopoverProps) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          sideOffset={8}
          className={cn(
            'z-dropdown border-border-default bg-surface w-80 rounded-md border p-4 shadow-md focus:outline-none',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
