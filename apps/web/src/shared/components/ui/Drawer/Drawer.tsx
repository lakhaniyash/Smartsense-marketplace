import type { ReactNode } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { CloseIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  side?: 'left' | 'right'
  className?: string
}

// Retains page context or fits content too long for a centered Modal —
// reach for this only when that's a genuine UX benefit, per
// docs/ui-guidelines.md § Dialogs & Modals (Drawer vs. Modal). Same Radix
// Dialog primitive as Modal, styled as a slide-in edge panel.
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  className,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <RadixDialog.Content
          className={cn(
            'fixed inset-y-0 z-50 flex w-full max-w-sm flex-col bg-white p-6 shadow-xl focus:outline-none dark:bg-gray-900',
            side === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </RadixDialog.Title>
              {description !== undefined && (
                <RadixDialog.Description className="mt-1 text-sm text-gray-500">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close aria-label="Close" className="text-gray-400 hover:text-gray-600">
              <CloseIcon className="size-5" aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children !== undefined && <div className="mt-4 flex-1 overflow-y-auto">{children}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
