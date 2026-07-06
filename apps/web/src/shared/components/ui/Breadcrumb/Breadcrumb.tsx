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
      className={cn('flex items-center text-sm text-gray-500', className)}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRightIcon className="size-4 shrink-0 text-gray-300" aria-hidden="true" />
              )}
              {item.href !== undefined && !isLast ? (
                <a href={item.href} className="hover:text-gray-700 dark:hover:text-gray-300">
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'font-medium text-gray-900 dark:text-gray-100' : undefined}
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
