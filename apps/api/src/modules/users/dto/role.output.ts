import { Field, ID, ObjectType } from '@nestjs/graphql'
import { PermissionOutput } from './permission.output'

@ObjectType('Role', {
  description:
    'A named bundle of Permissions a User can be assigned (docs/domain-model.md § Role). ' +
    'System roles (Admin/Partner/Customer) are seeded and protected from rename/delete/' +
    'permission edits.',
})
export class RoleOutput {
  @Field(() => ID)
  id!: string

  @Field()
  name!: string

  @Field(() => String, { nullable: true })
  description!: string | null

  @Field()
  isSystemRole!: boolean

  @Field(() => [PermissionOutput])
  permissions!: PermissionOutput[]
}
