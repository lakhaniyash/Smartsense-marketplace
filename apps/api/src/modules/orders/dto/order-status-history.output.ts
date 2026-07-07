import { OrderStatus } from '@prisma/client'
import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType('OrderStatusHistoryEntry', {
  description: "One row of an Order's status timeline (docs/domain-model.md § OrderStatusHistory).",
})
export class OrderStatusHistoryOutput {
  @Field(() => ID)
  id!: string

  @Field(() => OrderStatus, { nullable: true, description: 'Null for the initial creation row.' })
  fromStatus!: OrderStatus | null

  @Field(() => OrderStatus)
  toStatus!: OrderStatus

  @Field(() => ID, { nullable: true })
  changedByUserId!: string | null

  @Field(() => String, { nullable: true })
  reason!: string | null

  @Field()
  createdAt!: Date
}
