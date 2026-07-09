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
        <RadixDialog.Overlay className="z-overlay bg-overlay/50 fixed inset-0 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none" />
        <RadixDialog.Content
          className={cn(
            'z-modal bg-surface fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 shadow-xl focus:outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-fg-default text-xl font-semibold">
                {title}
              </RadixDialog.Title>
              {description !== undefined && (
                <RadixDialog.Description className="text-fg-muted mt-1 text-sm">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            {/* gray-400 → gray-600 hover had no dedicated token; fg-secondary is the
                closest role-match for the darker hover state. */}
            <RadixDialog.Close aria-label="Close" className="text-fg-muted hover:text-fg-secondary">
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
