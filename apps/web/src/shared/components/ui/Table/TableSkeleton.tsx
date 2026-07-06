import { Skeleton } from '../Skeleton'
import { TableBody, TableCell, TableRow } from './Table'

export interface TableSkeletonProps {
  rows?: number
  columns: number
}

// Skeleton rows matching the table's real column count, not a centered
// spinner — avoids the layout shift docs/ui-guidelines.md § Loading
// Experience warns a full-table spinner causes.
export function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
  return (
    <TableBody aria-hidden="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
