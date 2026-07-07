import { ProductStatus } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { CategoryOutput } from './category.output'
import { ProductVariantOutput } from './product-variant.output'

registerEnumType(ProductStatus, {
  name: 'ProductStatus',
  description: 'Lifecycle state per docs/domain-model.md § Catalog Management.',
})

@ObjectType('Product', {
  description:
    'A Partner catalog listing. Always has at least one ProductVariant ' +
    '(docs/domain-model.md § Product Variant); `sku` is flattened from the default one ' +
    'for convenience, and `variants` carries the full list for management.',
})
export class ProductOutput {
  @Field(() => ID)
  id!: string

  @Field()
  title!: string

  @Field(() => String, { nullable: true })
  description!: string | null

  @Field(() => String, { nullable: true })
  brand!: string | null

  @Field({ description: 'Flattened from the default ProductVariant.' })
  sku!: string

  @Field(() => ProductStatus)
  status!: ProductStatus

  @Field(() => CategoryOutput)
  category!: CategoryOutput

  @Field(() => [ProductVariantOutput])
  variants!: ProductVariantOutput[]

  @Field()
  createdAt!: Date

  @Field(() => Date, { nullable: true })
  publishedAt!: Date | null
}
