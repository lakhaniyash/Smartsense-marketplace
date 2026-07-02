import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType('CurrentUser', {
  description: 'The authenticated caller, plus their resolved roles and permissions.',
})
export class CurrentUserOutput {
  @Field(() => ID)
  id!: string

  @Field()
  email!: string

  @Field()
  fullName!: string

  @Field(() => [String], { description: 'Role.name values, e.g. ["Admin"]' })
  roles!: string[]

  @Field(() => [String], { description: 'Permission.key values, e.g. ["catalog:write"]' })
  permissions!: string[]
}
