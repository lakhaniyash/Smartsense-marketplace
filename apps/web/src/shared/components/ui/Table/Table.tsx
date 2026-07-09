import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@shared/utils'

// The <table> stays real table markup (role/semantics preserved for screen
// readers) but switches to a flex/block layout below `md`, turning each
// <tr> into a bordered card and each <td> into a labeled key/value row —
// docs/ui-guidelines.md § Tables' "converts to a stacked card-per-row
// layout... labeled key/value pairs" requirement, achieved generically
// rather than per-feature.
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('block w-full text-sm md:table', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('border-border-default hidden border-b md:table-header-group', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('block md:table-row-group', className)} {...props} />
}

export function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        'border-border-default hidden border-t font-medium md:table-footer-group',
        className,
      )}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-border-default md:hover:bg-surface-hover mb-3 block rounded-lg border p-4 last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:p-0 md:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('text-fg-muted px-4 py-3 text-left text-sm font-medium', className)}
      {...props}
    />
  )
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  label?: string
}

export function TableCell({ label, className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'text-fg-secondary flex items-center justify-between gap-4 py-1.5 md:table-cell md:justify-start md:px-4 md:py-3',
        className,
      )}
      {...props}
    >
      {label !== undefined && (
        <span className="text-fg-muted text-xs font-medium md:hidden">{label}</span>
      )}
      {children}
    </td>
  )
}

export function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn('text-fg-muted mt-4 text-sm', className)} {...props} />
}
