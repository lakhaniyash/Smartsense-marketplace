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
        'bg-canvas flex min-h-screen flex-col items-center justify-center px-4',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
      {footer !== undefined && <div className="text-fg-muted mt-8 text-sm">{footer}</div>}
    </div>
  )
}
