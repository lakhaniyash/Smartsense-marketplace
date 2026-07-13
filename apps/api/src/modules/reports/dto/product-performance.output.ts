import type { Prisma } from '@prisma/client'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'

@ObjectType('ProductPerformance', {
  description:
    'Units-sold/revenue ranking for a single Product Variant within the scoped period. ' +
    '"Sold" excludes CANCELLED orders (same convention as OrdersReport).',
})
export class ProductPerformanceOutput {
  @Field(() => ID)
  productVariantId!: string

  @Field()
  sku!: string

  @Field()
  productTitle!: string

  @Field(() => ID)
  partnerId!: string

  @Field(() => Int)
  unitsSold!: number

  @Field(() => DecimalScalar)
  revenue!: Prisma.Decimal
}
