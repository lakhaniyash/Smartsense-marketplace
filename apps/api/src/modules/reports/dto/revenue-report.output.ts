import type { Prisma } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'

@ObjectType('RevenueReportBucket', {
  description: 'One point in the revenue trend series, bucketed by the requested granularity.',
})
export class RevenueReportBucketOutput {
  @Field(() => Date)
  bucketStart!: Date

  @Field(() => Date)
  bucketEnd!: Date

  @Field(() => DecimalScalar)
  grossRevenue!: Prisma.Decimal

  @Field(() => Int)
  invoiceCount!: number
}

@ObjectType('RevenueReport', {
  description:
    'Invoice-ledger-derived revenue summary + trend for the scoped Partner(s)/period ' +
    '(same aggregation formula as BillingReport, computed on read rather than persisted).',
})
export class RevenueReportOutput {
  @Field(() => DecimalScalar)
  totalGrossRevenue!: Prisma.Decimal

  @Field(() => DecimalScalar)
  totalCommission!: Prisma.Decimal

  @Field(() => DecimalScalar)
  totalNetPayout!: Prisma.Decimal

  @Field(() => Int)
  invoiceCount!: number

  @Field(() => [RevenueReportBucketOutput])
  trend!: RevenueReportBucketOutput[]
}
