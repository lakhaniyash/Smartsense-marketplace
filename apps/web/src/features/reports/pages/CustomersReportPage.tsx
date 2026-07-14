import { useState } from 'react'
import { usePermissions } from '@features/auth'
import { ReportExportFormat, ReportExportType } from '@lib/graphql/__generated__/graphql'
import {
  Button,
  ErrorState,
  ExportMenu,
  KpiCard,
  PageHeader,
  useToast,
  type ExportFormat,
} from '@shared/components'
import { downloadBlob } from '@shared/utils'
import { CustomersBreakdownChart } from '../components'
import { useCustomersReport } from '../hooks'
import { exportReport } from '../services'

const KPI_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-1'

const EXPORT_FORMAT: Record<ExportFormat, ReportExportFormat> = {
  csv: ReportExportFormat.Csv,
  excel: ReportExportFormat.Excel,
}

// A point-in-time Customer count snapshot — no date range control, same
// reasoning as InventoryReportPage (CustomersReport's own doc comment,
// apps/api/src/schema.gql). SM-330: the first slice of the Customers
// breakdown (status + type); "new customers over time"/"top customers by
// spend" are separate, larger follow-up scope per the ticket's own text.
export function CustomersReportPage() {
  const { report, isLoading, error, refetch } = useCustomersReport()
  const { canViewReports } = usePermissions()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: ExportFormat) {
    setIsExporting(true)
    try {
      // `dateRange` is ignored server-side for a CUSTOMERS export
      // (ExportReportInput's own doc comment) — this is a snapshot, not a
      // period ledger, so none is sent.
      const csv = await exportReport({
        reportType: ReportExportType.Customers,
        format: EXPORT_FORMAT[format],
      })
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'customers-report.csv')
    } catch (exportError) {
      toast({
        title: "Couldn't export the customers report",
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
        title="Customers"
        description="Customer count by status and type."
        action={canViewReports && <ExportMenu onExport={handleExport} isExporting={isExporting} />}
      />

      {isLoading && (
        <div className={KPI_GRID_CLASSES}>
          <KpiCard label="" value={0} isLoading />
        </div>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load the customers report"
          description="Something went wrong while loading this report."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && report !== undefined && (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
          <div className={KPI_GRID_CLASSES}>
            <KpiCard label="Total customers" value={report.totalCustomers} format="count" />
          </div>
          <CustomersBreakdownChart
            statusBreakdown={report.statusBreakdown}
            typeBreakdown={report.typeBreakdown}
          />
        </div>
      )}
    </div>
  )
}
