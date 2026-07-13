import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { BillingReportSortField } from './billing-report-sort.enum'

@InputType()
export class BillingReportSortInput {
  // @IsOptional() here isn't about the GraphQL schema (see InvoiceSortInput's
  // identical comment) — AppValidationPipe substitutes `{}` for an omitted
  // nullable `sort` argument, so these required-looking fields still need it.
  @Field(() => BillingReportSortField)
  @IsOptional()
  @IsEnum(BillingReportSortField)
  field!: BillingReportSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
