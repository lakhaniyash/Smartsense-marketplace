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
import { NotificationActivityChart, ReportFilterBar } from '../components'
import { toDateRangeInput } from '../constants'
import { useNotificationActivityReport } from '../hooks'
import { exportReport } from '../services'

const KPI_GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-3'

const EXPORT_FORMAT: Record<ExportFormat, ReportExportFormat> = {
  csv: ReportExportFormat.Csv,
  excel: ReportExportFormat.Excel,
}

export function NotificationActivityReportPage() {
  const { report, isLoading, error, filters, setDateRange, refetch } =
    useNotificationActivityReport()
  const { canViewReports } = usePermissions()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: ExportFormat) {
    setIsExporting(true)
    try {
      const csv = await exportReport({
        reportType: ReportExportType.NotificationActivity,
        format: EXPORT_FORMAT[format],
        ...(filters.partnerId !== undefined && { partnerId: filters.partnerId }),
        dateRange: toDateRangeInput({ from: filters.from, to: filters.to }),
      })
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'notification-activity-report.csv')
    } catch (exportError) {
      toast({
        title: "Couldn't export the notification activity report",
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
        title="Notification Activity"
        description="Notification volume by type and read status."
        action={canViewReports && <ExportMenu onExport={handleExport} isExporting={isExporting} />}
      />
      <ReportFilterBar
        dateRange={{ from: filters.from, to: filters.to }}
        onDateRangeChange={setDateRange}
      />

      {isLoading && (
        <div className={KPI_GRID_CLASSES}>
          {Array.from({ length: 3 }, (_, index) => (
            <KpiCard key={index} label="" value={0} isLoading />
          ))}
        </div>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load the notification activity report"
          description="Something went wrong while loading this report."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && report !== undefined && (
        // The KPI/chart body scrolls in its own bounded region; PageHeader
        // and ReportFilterBar stay pinned above it, matching CatalogPage's
        // table-scrolls-not-the-page convention (docs/ui-guidelines.md §
        // Tables — Pagination row).
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
            <div className={KPI_GRID_CLASSES}>
              <KpiCard
                label="Total notifications"
                value={report.totalNotifications}
                format="count"
              />
              <KpiCard label="Read" value={report.readCount} format="count" />
              <KpiCard label="Unread" value={report.unreadCount} format="count" />
            </div>
            <NotificationActivityChart typeBreakdown={report.typeBreakdown} />
          </div>
        </div>
      )}
    </div>
  )
}
