import { Field, Int, ObjectType } from '@nestjs/graphql'

// Revenue is deliberately absent: it's money, and docs/graphql.md defers the
// Decimal/Money scalar to M14 (Billing) — a Float field now would set the
// wrong precedent for that field's eventual real type.
@ObjectType('DashboardStats', {
  description: 'Marketplace-wide summary counts shown on the dashboard overview.',
})
export class DashboardStatsOutput {
  @Field(() => Int, { description: 'Total non-deleted Product count, marketplace-wide.' })
  totalProducts!: number

  @Field(() => Int, { description: 'Total Order count, marketplace-wide.' })
  totalOrders!: number

  @Field(() => Int, { description: 'Total non-deleted Customer count, marketplace-wide.' })
  totalCustomers!: number
}
