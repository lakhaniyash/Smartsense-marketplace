import type { ReactNode } from 'react'
import { cn } from '@shared/utils'

export interface AuthLayoutProps {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

// Centered shell for public/auth-adjacent screens — a footer is reserved
// for these pages only, never the authenticated app shell, per
// docs/ui-guidelines.md § Footer Behavior.
export function AuthLayout({ children, footer, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
      {footer !== undefined && <div className="mt-8 text-sm text-gray-500">{footer}</div>}
    </div>
  )
}
