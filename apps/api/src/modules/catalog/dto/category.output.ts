import { Field, ID, Int, ObjectType } from '@nestjs/graphql'

@ObjectType('Category', {
  description:
    'A node in the global product category taxonomy, owned and maintained by Admin ' +
    '(docs/domain-model.md § Category). Returned as a flat list — clients build the ' +
    'parent/child tree from parentCategoryId.',
})
export class CategoryOutput {
  @Field(() => ID)
  id!: string

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(() => ID, {
    nullable: true,
    description: 'Parent category id, or null for a top-level category.',
  })
  parentCategoryId!: string | null

  @Field(() => Int, { description: 'Sort position among sibling categories.' })
  displayOrder!: number
}
