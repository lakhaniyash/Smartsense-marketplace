import { InvoiceStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { PaymentOutput } from './payment.output'

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description:
    'Full lifecycle per docs/domain-model.md § Invoice: DRAFT (generated but not yet sent) ' +
    '→ ISSUED → PARTIALLY_PAID → PAID, or ISSUED/DRAFT → VOID. generateInvoiceForOrder ' +
    'creates Invoices directly as ISSUED (docs/domain-model.md § Billing Flow) — DRAFT ' +
    'exists in the schema for a future pre-issuance workflow.',
})

@ObjectType('Invoice', {
  description: 'A per-Order billing document (docs/domain-model.md § Invoice).',
})
export class InvoiceOutput {
  @Field(() => ID)
  id!: string

  @Field()
  invoiceNumber!: string

  @Field(() => ID)
  orderId!: string

  @Field(() => ID)
  partnerId!: string

  @Field(() => DecimalScalar)
  amountDue!: Prisma.Decimal

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus

  @Field(() => Date, { nullable: true })
  issuedAt!: Date | null

  @Field(() => Date, { nullable: true })
  dueAt!: Date | null

  @Field(() => [PaymentOutput])
  payments!: PaymentOutput[]

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
