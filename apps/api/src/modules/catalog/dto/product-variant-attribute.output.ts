import { Field, ObjectType } from '@nestjs/graphql'

// Structured key/value pairs, not a JSON scalar (docs/graphql.md § 16 Common
// Anti-Patterns: "a single data: JSON scalar field... defeats GraphQL's
// entire type-safety and field-selection value proposition").
@ObjectType('ProductVariantAttribute')
export class ProductVariantAttributeOutput {
  @Field()
  key!: string

  @Field()
  value!: string
}
