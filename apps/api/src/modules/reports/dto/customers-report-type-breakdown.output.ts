import { CustomerType } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'

// CustomerType is already registered as a GraphQL enum by
// modules/customers/dto/customer.output.ts — see
// customers-report-status-breakdown.output.ts's identical comment on
// CustomerStatus for why this file doesn't re-register it.
@ObjectType('CustomersReportTypeBreakdown', {
  description: 'Customer count for a single CustomerType.',
})
export class CustomersReportTypeBreakdownOutput {
  @Field(() => CustomerType)
  type!: CustomerType

  @Field(() => Int)
  count!: number
}
