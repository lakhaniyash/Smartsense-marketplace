import { CustomerStatus } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'

// CustomerStatus is already registered as a GraphQL enum by
// modules/customers/dto/customer.output.ts — re-registering the same enum
// reference here would be redundant, so this file only imports and
// references it.
@ObjectType('CustomersReportStatusBreakdown', {
  description: 'Customer count for a single CustomerStatus.',
})
export class CustomersReportStatusBreakdownOutput {
  @Field(() => CustomerStatus)
  status!: CustomerStatus

  @Field(() => Int)
  count!: number
}
