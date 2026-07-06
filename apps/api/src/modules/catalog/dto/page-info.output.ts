import { Field, ObjectType } from '@nestjs/graphql'

// Relay-style cursor pagination shape (docs/graphql.md § 5 Pagination). Stays
// local to the catalog module until a second module needs the same shape —
// then it promotes to common/graphql/ per docs/graphql.md § 3 Shared Types.
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
