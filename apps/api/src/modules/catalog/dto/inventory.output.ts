import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType('Inventory', {
  description:
    'Stock levels for a ProductVariant (docs/domain-model.md § Inventory). ' +
    'sellableQuantity = quantityOnHand - quantityReserved, never negative.',
})
export class InventoryOutput {
  @Field(() => Int)
  quantityOnHand!: number

  @Field(() => Int)
  quantityReserved!: number

  @Field(() => Int, { description: 'Derived: quantityOnHand - quantityReserved.' })
  sellableQuantity!: number

  @Field(() => Int, { nullable: true, description: 'Optional low-stock alert threshold.' })
  reorderThreshold!: number | null

  @Field()
  updatedAt!: Date
}
