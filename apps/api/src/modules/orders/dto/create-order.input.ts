import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { IsNonNegativeDecimal } from '../../../common/validators/is-non-negative-decimal.validator'
import { CreateOrderItemInput } from './create-order-item.input'

@InputType()
export class CreateOrderInput {
  @Field(() => [CreateOrderItemInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items!: CreateOrderItemInput[]

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  shippingAddressId?: string

  @Field(() => ID, {
    nullable: true,
    description:
      "Required when the caller is Admin; ignored (overridden by the caller's own " +
      'customerId) for a Customer-scoped caller.',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string

  // Typed `string`, not Prisma.Decimal — see decimal.scalar.ts. No tax/shipping
  // calculation engine exists yet (docs/domain-model.md), so these are given
  // amounts, not derived ones; `subtotal`/`total` are always server-recomputed.
  @Field(() => DecimalScalar, { nullable: true, description: 'Defaults to 0.' })
  @IsOptional()
  @IsNonNegativeDecimal()
  tax?: string

  @Field(() => DecimalScalar, { nullable: true, description: 'Defaults to 0.' })
  @IsOptional()
  @IsNonNegativeDecimal()
  shippingCost?: string
}
