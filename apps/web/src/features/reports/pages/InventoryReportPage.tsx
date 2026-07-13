import { useState } from 'react'
import { usePermissions } from '@features/auth'
import { ReportExportFormat, ReportExportType } from '@lib/graphql/__generated__/graphql'
import {
  Button,
  EmptyState,
  ErrorState,
  ExportMenu,
  KpiCard,
  PageHeader,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  useToast,
  type ExportFormat,
} from '@shared/components'
import { downloadBlob } from '@shared/utils'
import { InventoryStatusChart } from '../components'
import { useInventoryReport } from '../hooks'
import { exportReport } from '../services'

const KPI_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
const COLUMN_COUNT = 5

const EXPORT_FORMAT: Record<ExportFormat, ReportExportFormat> = {
  csv: ReportExportFormat.Csv,
  excel: ReportExportFormat.Excel,
}

function LowStockTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Product</TableHead>
        <TableHead>SKU</TableHead>
        <TableHead className="md:text-right">On hand</TableHead>
        <TableHead className="md:text-right">Reserved</TableHead>
        <TableHead className="md:text-right">Reorder threshold</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// A point-in-time inventory snapshot — no date range control, unlike every
// other report page (InventoryReport's own doc comment, schema.gql).
export function InventoryReportPage() {
  const {
    report,
    lowStockItems,
    pageInfo,
    isLoading,
    error,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useInventoryReport()
  const { canViewReports } = usePermissions()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: ExportFormat) {
    setIsExporting(true)
    try {
      // `dateRange` is ignored server-side for an INVENTORY export
      // (ExportReportInput's own doc comment) — this is a snapshot, not a
      // period ledger, so none is sent.
      const csv = await exportReport({
        reportType: ReportExportType.Inventory,
        format: EXPORT_FORMAT[format],
      })
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'inventory-report.csv')
    } catch (exportError) {
      toast({
        title: "Couldn't export the inventory report",
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
        title="Inventory"
        description="Stock levels and low-stock alerts."
        action={canViewReports && <ExportMenu onExport={handleExport} isExporting={isExporting} />}
      />

      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className={KPI_GRID_CLASSES}>
            {Array.from({ length: 4 }, (_, index) => (
              <KpiCard key={index} label="" value={0} isLoading />
            ))}
          </div>
          <Table>
            <LowStockTableHead />
            <TableSkeleton rows={5} columns={COLUMN_COUNT} />
          </Table>
        </div>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load the inventory report"
          description="Something went wrong while loading this report."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && report !== undefined && (
        <>
          <div className={KPI_GRID_CLASSES}>
            <KpiCard label="Total variants" value={report.totalVariants} format="count" />
            <KpiCard label="Total on hand" value={report.totalOnHand} format="count" />
            <KpiCard label="Total reserved" value={report.totalReserved} format="count" />
            <KpiCard label="Low stock items" value={report.lowStockCount} format="count" />
          </div>
          <InventoryStatusChart
            totalVariants={report.totalVariants}
            lowStockCount={report.lowStockCount}
          />

          {lowStockItems.length === 0 && (
            <EmptyState
              title="No low-stock variants"
              description="Every variant with a reorder threshold set is above it."
            />
          )}

          {lowStockItems.length > 0 && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <Table>
                  <LowStockTableHead />
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.productVariantId}>
                        <TableCell label="Product">{item.productTitle}</TableCell>
                        <TableCell label="SKU">{item.sku}</TableCell>
                        <TableCell label="On hand" className="md:text-right">
                          {item.quantityOnHand}
                        </TableCell>
                        <TableCell label="Reserved" className="md:text-right">
                          {item.quantityReserved}
                        </TableCell>
                        <TableCell label="Reorder threshold" className="md:text-right">
                          {item.reorderThreshold ?? '—'}
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
          )}
        </>
      )}
    </div>
  )
}
