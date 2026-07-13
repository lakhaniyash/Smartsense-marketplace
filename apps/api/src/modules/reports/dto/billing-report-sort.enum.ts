import { registerEnumType } from '@nestjs/graphql'

export enum BillingReportSortField {
  GENERATED_AT = 'GENERATED_AT',
  PERIOD_START = 'PERIOD_START',
  GROSS_REVENUE = 'GROSS_REVENUE',
}

registerEnumType(BillingReportSortField, {
  name: 'BillingReportSortField',
  description: 'Fields the billing report list can be sorted by.',
})
