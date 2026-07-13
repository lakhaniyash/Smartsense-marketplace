import type { Prisma } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'

@ObjectType('CustomerBillingSummary', {
  description:
    "Aggregated across all of this Customer's Orders/Invoices. Computed only by " +
    '`customerById` — the `customers` list intentionally omits it (CustomerOutput.billingSummary ' +
    'is null there) to avoid an aggregate query per row.',
})
export class CustomerBillingSummaryOutput {
  @Field(() => Int)
  totalOrders!: number

  @Field(() => DecimalScalar)
  totalInvoiced!: Prisma.Decimal

  @Field(() => DecimalScalar, {
    description: 'Sum of amountDue on invoices not yet fully settled (ISSUED or PARTIALLY_PAID).',
  })
  totalOutstanding!: Prisma.Decimal
}
