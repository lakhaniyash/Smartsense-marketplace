import type { HTMLAttributes } from 'react'
import { cn } from '@shared/utils'

// A keyboard-shortcut hint (⌘K, Ctrl+K) — used by the header's search
// trigger and the command palette, so it earns its place in the shared
// library at introduction rather than being copy-pasted between the two.
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'border-border-default bg-surface-subtle text-fg-muted rounded border px-1.5 py-0.5 font-sans text-xs',
        className,
      )}
      {...props}
    />
  )
}
