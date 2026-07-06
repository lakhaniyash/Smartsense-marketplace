import type { ReactNode } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CloseIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export type ToastVariant = 'default' | 'success' | 'danger'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends ToastOptions {
  id: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default:
    'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100',
  success: 'border-success-subtle bg-success-subtle text-success-emphasis',
  danger: 'border-danger-subtle bg-danger-subtle text-danger-emphasis',
}

// Confirms a completed action without requiring the user to dismiss it —
// auto-dismisses, stacks in one consistent corner, per
// docs/ui-guidelines.md § Feedback Components (Toasts).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const toast = useCallback((options: ToastOptions) => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [...current, { ...options, id }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => (
          <RadixToast.Root
            key={item.id}
            duration={5000}
            onOpenChange={(open) => {
              if (!open) {
                dismiss(item.id)
              }
            }}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-md transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
              VARIANT_CLASSES[item.variant ?? 'default'],
            )}
          >
            <div className="flex flex-1 flex-col gap-1">
              <RadixToast.Title className="text-sm font-medium">{item.title}</RadixToast.Title>
              {item.description !== undefined && (
                <RadixToast.Description className="text-sm">
                  {item.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close aria-label="Dismiss" className="text-gray-400 hover:text-gray-600">
              <CloseIcon className="size-4" aria-hidden="true" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed right-0 bottom-0 z-50 flex w-full max-w-sm flex-col gap-2 p-6" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
