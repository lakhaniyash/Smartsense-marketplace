import { useState } from 'react'
import { usePermissions } from '@features/auth'
import {
  ProductPerformanceSortField,
  ReportExportFormat,
  ReportExportType,
  SortDirection,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  EmptyState,
  ErrorState,
  ExportMenu,
  PageHeader,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  useToast,
  type ExportFormat,
  type SelectOption,
} from '@shared/components'
import { downloadBlob } from '@shared/utils'
import { ProductPerformanceChart, ReportFilterBar } from '../components'
import { toDateRangeInput } from '../constants'
import { useProductPerformanceReport } from '../hooks'
import { exportReport } from '../services'

const COLUMN_COUNT = 4

const EXPORT_FORMAT: Record<ExportFormat, ReportExportFormat> = {
  csv: ReportExportFormat.Csv,
  excel: ReportExportFormat.Excel,
}

const SORT_FIELD_OPTIONS: SelectOption[] = [
  { value: ProductPerformanceSortField.Revenue, label: 'Revenue' },
  { value: ProductPerformanceSortField.UnitsSold, label: 'Units sold' },
]

const SORT_DIRECTION_OPTIONS: SelectOption[] = [
  { value: SortDirection.Desc, label: 'Highest first' },
  { value: SortDirection.Asc, label: 'Lowest first' },
]

function ProductPerformanceTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Product</TableHead>
        <TableHead>SKU</TableHead>
        <TableHead className="md:text-right">Units sold</TableHead>
        <TableHead className="md:text-right">Revenue</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// No clickable-header sort precedent exists elsewhere in the app (Orders/
// Catalog never exposed one) — a `Select` pair (field + direction) matches
// every other filter control's vocabulary instead of inventing a new
// interaction.
function SortControls({
  sortField,
  sortDirection,
  onSortChange,
}: {
  sortField: ProductPerformanceSortField
  sortDirection: SortDirection
  onSortChange: (field: ProductPerformanceSortField, direction: SortDirection) => void
}) {
  return (
    <div className="flex gap-3">
      <Select
        aria-label="Sort by"
        options={SORT_FIELD_OPTIONS}
        value={sortField}
        onChange={(event) =>
          onSortChange(event.target.value as ProductPerformanceSortField, sortDirection)
        }
      />
      <Select
        aria-label="Sort direction"
        options={SORT_DIRECTION_OPTIONS}
        value={sortDirection}
        onChange={(event) => onSortChange(sortField, event.target.value as SortDirection)}
      />
    </div>
  )
}

export function ProductPerformanceReportPage() {
  const {
    items,
    pageInfo,
    filters,
    isLoading,
    error,
    setDateRange,
    setSort,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useProductPerformanceReport()
  const { canViewReports } = usePermissions()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: ExportFormat) {
    setIsExporting(true)
    try {
      const csv = await exportReport({
        reportType: ReportExportType.ProductPerformance,
        format: EXPORT_FORMAT[format],
        ...(filters.partnerId !== undefined && { partnerId: filters.partnerId }),
        dateRange: toDateRangeInput({ from: filters.from, to: filters.to }),
      })
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'product-performance-report.csv')
    } catch (exportError) {
      toast({
        title: "Couldn't export the product performance report",
        ...(exportError instanceof Error && { description: exportError.message }),
        variant: 'danger',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Product Performance"
        description="Units sold and revenue ranked by product."
        action={canViewReports && <ExportMenu onExport={handleExport} isExporting={isExporting} />}
      />
      <ReportFilterBar
        dateRange={{ from: filters.from, to: filters.to }}
        onDateRangeChange={setDateRange}
        extraFilters={
          <SortControls
            sortField={filters.sortField}
            sortDirection={filters.sortDirection}
            onSortChange={setSort}
          />
        }
      />

      {isLoading && (
        <Table>
          <ProductPerformanceTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load the product performance report"
          description="Something went wrong while loading this report."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && items.length === 0 && (
        <EmptyState
          title="No product activity for this period"
          description="Try a different date range."
        />
      )}

      {!isLoading && error === undefined && items.length > 0 && (
        <>
          <ProductPerformanceChart items={items} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <Table>
                <ProductPerformanceTableHead />
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productVariantId}>
                      <TableCell label="Product">{item.productTitle}</TableCell>
                      <TableCell label="SKU">{item.sku}</TableCell>
                      <TableCell label="Units sold" className="md:text-right">
                        {item.unitsSold}
                      </TableCell>
                      <TableCell label="Revenue" className="md:text-right">
                        ${item.revenue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-border-default border-t pt-3">
              <Pagination
                hasPreviousPage={hasPreviousPage}
                hasNextPage={pageInfo?.hasNextPage ?? false}
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
