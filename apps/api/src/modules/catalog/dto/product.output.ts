import { ProductStatus } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { CategoryOutput } from './category.output'

registerEnumType(ProductStatus, {
  name: 'ProductStatus',
  description: 'Lifecycle state per docs/domain-model.md § Catalog Management.',
})

@ObjectType('Product', {
  description:
    'A Partner catalog listing. SKU is flattened here from an internal ProductVariant ' +
    'record the service layer creates and maintains automatically — Variants and ' +
    'Inventory are not modeled in this API yet (M12 Catalog Foundation scope; see ' +
    'docs/milestones.md M12). Price is intentionally absent until the Decimal/Money ' +
    'scalar ships with M14 Billing.',
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

  @Field({ description: 'Flattened from the internal singleton ProductVariant.' })
  sku!: string

  @Field(() => ProductStatus)
  status!: ProductStatus

  @Field(() => CategoryOutput)
  category!: CategoryOutput

  @Field()
  createdAt!: Date

  @Field(() => Date, { nullable: true })
  publishedAt!: Date | null
}
