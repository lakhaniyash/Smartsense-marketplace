import { Field, Int, ObjectType } from '@nestjs/graphql'

// Mock counts only, per docs/milestones.md M11 — Catalog/Orders don't exist yet, so these
// numbers stand in for real prisma.product.count()/prisma.order.count() queries that will
// replace them once those modules ship. Revenue is deliberately absent: it's money, and
// docs/graphql.md defers the Decimal/Money scalar to M14 (Billing) — a mock Float field now
// would set the wrong precedent for that field's eventual real type.
@ObjectType('DashboardStats', {
  description: 'Marketplace-wide summary counts shown on the dashboard overview.',
})
export class DashboardStatsOutput {
  @Field(() => Int, {
    description: 'Mock total product count — replaced when Catalog (M12) ships.',
  })
  totalProducts!: number

  @Field(() => Int, { description: 'Mock total order count — replaced when Orders (M13) ships.' })
  totalOrders!: number

  @Field(() => Int, {
    description: 'Mock total customer count — replaced when Orders (M13) ships.',
  })
  totalCustomers!: number
}
