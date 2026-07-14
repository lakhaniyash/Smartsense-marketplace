import { Field, Int, ObjectType } from '@nestjs/graphql'
import { CustomersReportStatusBreakdownOutput } from './customers-report-status-breakdown.output'
import { CustomersReportTypeBreakdownOutput } from './customers-report-type-breakdown.output'

@ObjectType('CustomersReport', {
  description:
    'A point-in-time Customer count snapshot for the scoped Partner(s), broken down by status ' +
    "and type. No date range or trend field — SM-330's own ticket flagged " +
    '"new customers over time"/"top customers by spend" as separate, larger scope than this ' +
    'first slice, which mirrors the Orders/Notification Activity report shape.',
})
export class CustomersReportOutput {
  @Field(() => Int)
  totalCustomers!: number

  @Field(() => [CustomersReportStatusBreakdownOutput])
  statusBreakdown!: CustomersReportStatusBreakdownOutput[]

  @Field(() => [CustomersReportTypeBreakdownOutput])
  typeBreakdown!: CustomersReportTypeBreakdownOutput[]
}
