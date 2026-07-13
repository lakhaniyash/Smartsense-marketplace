import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

@ObjectType('InventoryReportItem', {
  description:
    'A single low-stock Product Variant: quantityOnHand < reorderThreshold ' +
    '(docs/domain-model.md § Inventory). Variants with no reorderThreshold set never appear ' +
    "here — a data-completeness gap, not a bug (see the plan's Risks section).",
})
export class InventoryReportItemOutput {
  @Field(() => ID)
  productVariantId!: string

  @Field()
  sku!: string

  @Field()
  productTitle!: string

  @Field(() => ID)
  partnerId!: string

  @Field(() => Int)
  quantityOnHand!: number

  @Field(() => Int)
  quantityReserved!: number

  @Field(() => Int, { nullable: true })
  reorderThreshold!: number | null
}
