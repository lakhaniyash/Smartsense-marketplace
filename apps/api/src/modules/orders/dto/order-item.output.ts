import type { Prisma } from '@prisma/client'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { ProductVariantOutput } from '../../catalog/dto/product-variant.output'

@ObjectType('OrderItem', {
  description:
    'An immutable line item on an Order (docs/domain-model.md § Order Item). ' +
    'unitPriceSnapshot is captured at order placement and never recalculated ' +
    'from the live ProductVariant.price.',
})
export class OrderItemOutput {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  productVariantId!: string

  @Field(() => ProductVariantOutput)
  productVariant!: ProductVariantOutput

  @Field(() => Int)
  quantity!: number

  @Field(() => DecimalScalar)
  unitPriceSnapshot!: Prisma.Decimal

  @Field(() => DecimalScalar)
  lineTotal!: Prisma.Decimal
}
