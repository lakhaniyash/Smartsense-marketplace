import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType('Permission', {
  description:
    'A single seeded capability key (docs/authorization.md § The Seeded Catalog). Read-only — ' +
    'permissions are seeded/managed by the platform, not created ad hoc through the UI in v1 ' +
    '(docs/domain-model.md § Permission).',
})
export class PermissionOutput {
  @Field(() => ID)
  id!: string

  @Field()
  key!: string

  @Field(() => String, { nullable: true })
  description!: string | null

  @Field()
  domain!: string
}
