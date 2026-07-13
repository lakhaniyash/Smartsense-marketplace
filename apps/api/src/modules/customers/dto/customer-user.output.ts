import { UserStatus } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description:
    "A User's lifecycle status (docs/domain-model.md § User). First GraphQL exposure of this " +
    'enum — introduced for the Customer Management "assigned users" tab.',
})

@ObjectType('CustomerUser', {
  description:
    'A buyer-contact User belonging to this Customer (the existing `User.customerId` relation) ' +
    '— not a separate account-manager assignment (docs/domain-model.md § User Ownership).',
})
export class CustomerUserOutput {
  @Field(() => ID)
  id!: string

  @Field()
  email!: string

  @Field()
  fullName!: string

  @Field(() => UserStatus)
  status!: UserStatus
}
