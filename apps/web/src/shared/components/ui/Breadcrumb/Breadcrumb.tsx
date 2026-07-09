import { Link } from 'react-router'
import { ChevronRightIcon } from '@shared/icons'
import { cn } from '@shared/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

// Shown only on pages nested more than one level deep — omitted on
// top-level list pages, per docs/ui-guidelines.md § Navigation.
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('text-fg-muted flex items-center text-sm', className)}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRightIcon className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
              )}
              {item.href !== undefined && !isLast ? (
                <Link to={item.href} className="hover:text-fg-secondary">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-fg-default font-medium' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
