import { ProductVariantStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { InventoryOutput } from './inventory.output'
import { ProductVariantAttributeOutput } from './product-variant-attribute.output'

registerEnumType(ProductVariantStatus, {
  name: 'ProductVariantStatus',
  description:
    'ACTIVE/OUT_OF_STOCK are derived automatically from Inventory and cannot be set ' +
    'directly. DISCONTINUED is a manual, terminal Partner action (docs/domain-model.md ' +
    '§ Product Variant).',
})

@ObjectType('ProductVariant', {
  description: 'The sellable SKU beneath a Product (docs/domain-model.md § Product Variant).',
})
export class ProductVariantOutput {
  @Field(() => ID)
  id!: string

  @Field()
  sku!: string

  @Field(() => [ProductVariantAttributeOutput])
  attributes!: ProductVariantAttributeOutput[]

  @Field(() => DecimalScalar)
  price!: Prisma.Decimal

  @Field(() => ProductVariantStatus)
  status!: ProductVariantStatus

  @Field({ description: "Whether this is the Product's default Variant. Exactly one per Product." })
  isDefault!: boolean

  @Field(() => InventoryOutput)
  inventory!: InventoryOutput

  @Field()
  createdAt!: Date
}
