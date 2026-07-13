import type { Prisma } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { RevenueReportBucketOutput } from './revenue-report.output'

@ObjectType('ReportsDashboard', {
  description:
    'KPI + trend summary for the Reports landing page. A dedicated query — never reuses or ' +
    'touches dashboardStats (the M11 marketplace-wide overview card), which stays untouched.',
})
export class ReportsDashboardOutput {
  @Field(() => DecimalScalar, { description: 'Same formula as RevenueReport.totalGrossRevenue.' })
  grossRevenue!: Prisma.Decimal

  @Field(() => Int)
  totalOrders!: number

  @Field(() => DecimalScalar, { description: 'Same formula as OrdersReport.totalRevenue.' })
  ordersRevenue!: Prisma.Decimal

  @Field(() => Int, { description: 'Same definition as InventoryReport.lowStockCount.' })
  lowStockCount!: number

  @Field(() => [RevenueReportBucketOutput])
  revenueTrend!: RevenueReportBucketOutput[]
}
