import { UserOwnerType, UserStatus } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { RoleOutput } from './role.output'

// UserStatus is already registered as a GraphQL enum by
// modules/customers/dto/customer-user.output.ts — re-registering the same
// enum reference here would be redundant, so this file only imports and
// references it (same reasoning as OrdersReportStatusBreakdownOutput's own
// comment on OrderStatus).
registerEnumType(UserOwnerType, {
  name: 'UserOwnerType',
  description:
    'Which organization, if any, this User acts on behalf of (docs/domain-model.md § User).',
})

@ObjectType('User', {
  description:
    'A platform user — Admin, Partner staff, or Customer buyer-contact (docs/domain-model.md ' +
    '§ User). Sprint 3 (User Management, Jira Epic SM-331) — not tied to a docs/milestones.md ' +
    'milestone.',
})
export class UserOutput {
  @Field(() => ID)
  id!: string

  @Field()
  email!: string

  @Field()
  fullName!: string

  @Field(() => UserStatus)
  status!: UserStatus

  @Field(() => UserOwnerType)
  ownerType!: UserOwnerType

  @Field(() => ID, { nullable: true })
  partnerId!: string | null

  @Field(() => ID, { nullable: true })
  customerId!: string | null

  @Field(() => [RoleOutput])
  roles!: RoleOutput[]

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
