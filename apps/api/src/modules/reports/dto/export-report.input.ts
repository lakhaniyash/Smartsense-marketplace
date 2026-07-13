import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { DateRangeInput } from '../../../common/graphql/date-range.input'
import { ReportExportFormat } from './report-export-format.enum'
import { ReportExportType } from './report-export-type.enum'

// A single flattened filter (partnerId + dateRange) rather than per-report
// filter unions — every report type's filter is a subset of these two
// fields (InventoryReportFilterInput omits dateRange; ReportsService
// ignores dateRange for an INVENTORY export the same way inventoryReport's
// own resolver never accepts one).
@InputType()
export class ExportReportInput {
  @Field(() => ReportExportType)
  @IsEnum(ReportExportType)
  reportType!: ReportExportType

  @Field(() => ReportExportFormat)
  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat

  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @Field(() => DateRangeInput, {
    nullable: true,
    description: 'Ignored for a BILLING_REPORTS or INVENTORY export. Omitted = all time.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeInput)
  dateRange?: DateRangeInput
}
