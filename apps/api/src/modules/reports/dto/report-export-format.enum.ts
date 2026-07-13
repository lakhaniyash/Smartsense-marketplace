import { registerEnumType } from '@nestjs/graphql'

// EXCEL is a foundation-only placeholder: exportReport throws a clean
// BadRequestException for it today (ReportsService.exportReport) — the
// enum member exists so the frontend's ExportMenu can show it as a
// visibly-present, disabled option rather than silently missing, and so
// wiring up a real implementation later is a one-line change here.
export enum ReportExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

registerEnumType(ReportExportFormat, {
  name: 'ReportExportFormat',
  description: 'CSV is fully implemented today; EXCEL is a not-yet-implemented placeholder.',
})
