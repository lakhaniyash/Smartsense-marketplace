import { apolloClient } from '@lib/apollo'
import {
  ExportReportDocument,
  type DateRangeInput,
  type ReportExportFormat,
  type ReportExportType,
} from '@lib/graphql/__generated__/graphql'

export interface ExportReportParams {
  reportType: ReportExportType
  format: ReportExportFormat
  partnerId?: string | undefined
  dateRange?: DateRangeInput | undefined
}

// Imperative, non-hook operation triggered by ExportMenu's callback rather
// than a component's render — the Services tier per
// docs/frontend-architecture.md § Feature Module Architecture — a
// generalization of Billing's `exportInvoicesCsv` (apolloClient.query +
// promoted `downloadBlob`), parameterized by report type/format/filters
// instead of hand-rolled per report. `apolloClient`'s default `query` fetch
// policy is already `network-only` (docs/graphql.md § 9), so an export
// always reflects the caller's current, visible data.
export async function exportReport(params: ExportReportParams): Promise<string> {
  const { data } = await apolloClient.query({
    query: ExportReportDocument,
    variables: {
      input: {
        reportType: params.reportType,
        format: params.format,
        ...(params.partnerId !== undefined && { partnerId: params.partnerId }),
        ...(params.dateRange !== undefined && { dateRange: params.dateRange }),
      },
    },
  })
  return data.exportReport
}
