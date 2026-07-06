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
