import { ChevronLeftIcon, ChevronRightIcon } from '@shared/icons'
import { cn } from '@shared/utils'
import { Button } from '../Button'

export interface PaginationProps {
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPrevious: () => void
  onNext: () => void
  className?: string
}

// Cursor-driven prev/next only — a cursor connection has no stable page
// numbers, so no "jump to page N" control is offered, per
// docs/ui-guidelines.md § Tables and docs/graphql.md § Pagination.
//
// A full-height list page (CatalogPage, OrdersPage) renders this as the
// last, non-scrolling child of a bounded-height flex column, with the
// table itself in a `flex-1 overflow-y-auto` region above it — never
// `position: sticky` over the scrolling content. Sticky looked simpler but
// is genuinely fragile here: Table's own horizontal-scroll wrapper
// (`overflow-x-auto`) gets its vertical overflow silently promoted to
// `auto` too (the CSS spec's "visible next to scroll/auto" rule), which
// interacts badly with a sticky sibling and produced a real, visible
// content/footer overlap. A plain footer in normal flow can't overlap
// anything — it isn't floating over the content, it just occupies its own
// space below it.
export function Pagination({
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
  className,
}: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-end gap-2', className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrevious}
        disabled={!hasPreviousPage}
        leadingIcon={<ChevronLeftIcon className="size-4" aria-hidden="true" />}
      >
        Previous
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={!hasNextPage}
        trailingIcon={<ChevronRightIcon className="size-4" aria-hidden="true" />}
      >
        Next
      </Button>
    </nav>
  )
}
