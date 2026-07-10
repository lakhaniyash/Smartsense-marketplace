import { PaymentMethod } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { IsEnum, IsString, IsUUID } from 'class-validator'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { IsPositiveDecimal } from '../../../common/validators/is-positive-decimal.validator'

@InputType()
export class CreatePaymentInput {
  @Field(() => ID)
  @IsUUID()
  invoiceId!: string

  // Typed `string`, not Prisma.Decimal — see decimal.scalar.ts.
  @Field(() => DecimalScalar)
  @IsPositiveDecimal()
  amount!: string

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  method!: PaymentMethod

  @Field()
  @IsString()
  externalTransactionId!: string

  // Caller-generated (docs/api-conventions.md § Idempotency — this mutation
  // is that section's canonical example). A retry of the same payment must
  // reuse the same key so BillingService.recordPayment returns the original
  // result instead of creating a duplicate Payment.
  @Field(() => ID, { description: 'Caller-generated UUID; retries must reuse the same value.' })
  @IsUUID()
  idempotencyKey!: string
}
