import type { ReactNode } from 'react'
import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@shared/utils'

export interface MenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

// Generic dropdown/overflow menu primitive — the header's user menu, a
// table row's action menu, and any future "..." overflow trigger all
// compose this instead of hand-rolling ARIA menu/keyboard behavior
// (docs/ui-guidelines.md § Anti-Patterns: "A custom div reimplementing
// button/tab/menu keyboard behavior by hand").
export function Menu({ trigger, children, align = 'end', className }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={8}
          className={cn(
            'z-dropdown border-border-default bg-surface min-w-48 rounded-md border p-1 shadow-md focus:outline-none',
            className,
          )}
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}

export interface MenuItemProps {
  children: ReactNode
  onSelect?: (() => void) | undefined
  variant?: 'default' | 'danger'
  disabled?: boolean | undefined
  icon?: ReactNode
}

export function MenuItem({
  children,
  onSelect,
  variant = 'default',
  disabled,
  icon,
}: MenuItemProps) {
  return (
    <RadixMenu.Item
      {...(onSelect !== undefined && { onSelect: () => onSelect() })}
      {...(disabled !== undefined && { disabled })}
      className={cn(
        'data-[highlighted]:bg-surface-hover flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        variant === 'danger'
          ? 'text-danger'
          : 'text-fg-secondary data-[highlighted]:text-fg-default',
      )}
    >
      {icon}
      {children}
    </RadixMenu.Item>
  )
}

export function MenuSeparator() {
  return <RadixMenu.Separator className="bg-border-default my-1 h-px" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <RadixMenu.Label className="text-fg-muted px-2 py-1.5 text-xs font-medium">
      {children}
    </RadixMenu.Label>
  )
}
