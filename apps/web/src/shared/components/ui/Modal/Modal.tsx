import type { ReactNode } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { CloseIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

// The base overlay primitive — Dialog (confirmations) and Drawer (slide-in
// panels) both compose this rather than reimplementing focus trap/Escape/
// backdrop, avoiding docs/ui-guidelines.md's "second, slightly different
// Modal" anti-pattern.
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <RadixDialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none dark:bg-gray-900',
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
          {children !== undefined && <div className="mt-4">{children}</div>}
          {footer !== undefined && (
            <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
