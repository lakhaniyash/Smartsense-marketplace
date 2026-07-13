import { AddressType } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'

registerEnumType(AddressType, {
  name: 'AddressType',
  description: 'Shipping, Billing, or Registered (docs/domain-model.md § Address).',
})

@ObjectType('CustomerAddress', {
  description:
    "One of a Customer's addresses (docs/domain-model.md § Address). `ownerType`/`customerId` " +
    'are omitted — implied by the parent Customer this is nested under.',
})
export class CustomerAddressOutput {
  @Field(() => ID)
  id!: string

  @Field(() => AddressType)
  type!: AddressType

  @Field()
  line1!: string

  @Field(() => String, { nullable: true })
  line2!: string | null

  @Field()
  city!: string

  @Field()
  state!: string

  @Field()
  postalCode!: string

  @Field()
  country!: string

  @Field()
  isDefault!: boolean
}
