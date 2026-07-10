import { PaymentMethod, PaymentStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'How a Payment was settled (docs/domain-model.md § Payment).',
})

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description:
    'v1 has no live payment gateway (docs/roadmap.md) — a recorded Payment is created ' +
    'directly as SUCCEEDED. PENDING/FAILED/REFUNDED exist in the schema for a future ' +
    'gateway integration and are not yet reachable through recordPayment.',
})

@ObjectType('Payment', {
  description:
    'A single payment transaction applied against an Invoice (docs/domain-model.md § Payment).',
})
export class PaymentOutput {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  invoiceId!: string

  @Field(() => DecimalScalar)
  amount!: Prisma.Decimal

  @Field(() => PaymentMethod)
  method!: PaymentMethod

  @Field()
  externalTransactionId!: string

  @Field(() => PaymentStatus)
  status!: PaymentStatus

  @Field(() => Date, { nullable: true })
  processedAt!: Date | null

  @Field()
  createdAt!: Date
}
