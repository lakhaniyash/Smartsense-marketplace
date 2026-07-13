import { BillingReportStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'

registerEnumType(BillingReportStatus, {
  name: 'BillingReportStatus',
  description:
    'Lifecycle per docs/domain-model.md § Billing Report: GENERATED (just computed) → ' +
    'FINALIZED (locked, ready for payout) → PAID_OUT (payout completed).',
})

@ObjectType('BillingReport', {
  description:
    'A periodic per-Partner statement reconciling Invoice/Payment activity for a date range ' +
    '(docs/domain-model.md § Billing Report). The only persisted Reports entity — every other ' +
    'report in this module is computed on read.',
})
export class BillingReportOutput {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  partnerId!: string

  @Field(() => Date)
  periodStart!: Date

  @Field(() => Date)
  periodEnd!: Date

  @Field(() => DecimalScalar, {
    description:
      'SUM(Invoice.amountDue) for ISSUED/PARTIALLY_PAID/PAID invoices issued in the period.',
  })
  grossRevenue!: Prisma.Decimal

  @Field(() => DecimalScalar, { description: 'grossRevenue * (Partner.commissionRate / 100).' })
  commissionAmount!: Prisma.Decimal

  @Field(() => DecimalScalar, { description: 'grossRevenue - commissionAmount.' })
  netPayout!: Prisma.Decimal

  @Field(() => BillingReportStatus)
  status!: BillingReportStatus

  @Field()
  generatedAt!: Date

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
