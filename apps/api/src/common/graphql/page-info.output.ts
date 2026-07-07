import { Field, ObjectType } from '@nestjs/graphql'

// Relay-style cursor pagination shape (docs/graphql.md § 5 Pagination).
// Promoted from the Catalog module once Orders (M13) became its second
// consumer, per docs/graphql.md § 3 Shared Types.
@ObjectType('PageInfo')
export class PageInfoOutput {
  @Field()
  hasNextPage!: boolean

  @Field()
  hasPreviousPage!: boolean

  @Field(() => String, { nullable: true })
  startCursor!: string | null

  @Field(() => String, { nullable: true })
  endCursor!: string | null
}
