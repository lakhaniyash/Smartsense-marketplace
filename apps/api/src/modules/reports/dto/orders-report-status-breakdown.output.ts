import { OrderStatus } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'

// OrderStatus is already registered as a GraphQL enum by
// modules/orders/dto/order.output.ts — re-registering the same enum
// reference here would be redundant (and order.output.ts is guaranteed to
// load first, since OrdersModule is registered ahead of ReportsModule in
// app.module.ts), so this file only imports and references it.
@ObjectType('OrdersReportStatusBreakdown', {
  description: 'Order count for a single OrderStatus within the scoped period.',
})
export class OrdersReportStatusBreakdownOutput {
  @Field(() => OrderStatus)
  status!: OrderStatus

  @Field(() => Int)
  count!: number
}
