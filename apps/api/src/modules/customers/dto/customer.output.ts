import { CustomerStatus, CustomerType } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { CustomerAddressOutput } from './customer-address.output'
import { CustomerBillingSummaryOutput } from './customer-billing-summary.output'
import { CustomerUserOutput } from './customer-user.output'

registerEnumType(CustomerType, {
  name: 'CustomerType',
  description: 'Individual buyer vs. buyer organization (docs/domain-model.md § Customer).',
})

registerEnumType(CustomerStatus, {
  name: 'CustomerStatus',
  description:
    'Active or Suspended (docs/domain-model.md § Customer Lifecycle). There is no hard-delete ' +
    'status — Customers are anonymized, never removed, per the same doc.',
})

@ObjectType('Customer', {
  description: 'A buyer — an individual or organization (docs/domain-model.md § Customer).',
})
export class CustomerOutput {
  @Field(() => ID)
  id!: string

  @Field()
  displayName!: string

  @Field(() => CustomerType)
  type!: CustomerType

  @Field(() => CustomerStatus)
  status!: CustomerStatus

  @Field()
  billingEmail!: string

  @Field(() => [CustomerAddressOutput])
  addresses!: CustomerAddressOutput[]

  @Field(() => [CustomerUserOutput], {
    description:
      'Buyer-contact Users belonging to this Customer (User.customerId) — the "assigned ' +
      'users" tab; not a separate account-manager concept.',
  })
  assignedUsers!: CustomerUserOutput[]

  @Field(() => CustomerBillingSummaryOutput, {
    nullable: true,
    description: "Populated only when fetched via customerById — see that type's own description.",
  })
  billingSummary!: CustomerBillingSummaryOutput | null

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
