import { OrderStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { OrderItemOutput } from './order-item.output'
import { OrderStatusHistoryOutput } from './order-status-history.output'

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description:
    'Full lifecycle per docs/domain-model.md § Order Lifecycle. M13 implemented transitions ' +
    'among DRAFT/CONFIRMED/PROCESSING/CANCELLED; M14 (Billing) added ' +
    'PROCESSING→SHIPPED→DELIVERED→COMPLETED so invoice generation has a trigger — the ' +
    'remaining values (PENDING_PAYMENT, RETURN_REQUESTED, REFUNDED) exist in the schema for ' +
    'future milestones and are not yet reachable.',
})

@ObjectType('Order', {
  description: 'A single-Partner order (docs/domain-model.md § Order).',
})
export class OrderOutput {
  @Field(() => ID)
  id!: string

  @Field()
  orderNumber!: string

  @Field(() => ID)
  customerId!: string

  @Field(() => ID)
  partnerId!: string

  @Field(() => ID, { nullable: true })
  shippingAddressId!: string | null

  @Field(() => OrderStatus)
  status!: OrderStatus

  @Field(() => DecimalScalar)
  subtotal!: Prisma.Decimal

  @Field(() => DecimalScalar)
  tax!: Prisma.Decimal

  @Field(() => DecimalScalar)
  shippingCost!: Prisma.Decimal

  @Field(() => DecimalScalar)
  total!: Prisma.Decimal

  @Field(() => [OrderItemOutput])
  items!: OrderItemOutput[]

  @Field(() => [OrderStatusHistoryOutput], { description: 'Oldest first.' })
  statusHistory!: OrderStatusHistoryOutput[]

  @Field(() => Date, { nullable: true })
  placedAt!: Date | null

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
