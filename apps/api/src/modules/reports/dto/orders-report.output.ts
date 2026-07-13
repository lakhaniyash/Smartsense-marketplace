import type { Prisma } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { OrdersReportStatusBreakdownOutput } from './orders-report-status-breakdown.output'

@ObjectType('OrdersReport', {
  description:
    'Order-volume summary for the scoped Partner(s)/period. totalRevenue/averageOrderValue ' +
    'exclude CANCELLED orders (a cancelled order was never fulfilled revenue).',
})
export class OrdersReportOutput {
  @Field(() => Int)
  totalOrders!: number

  @Field(() => DecimalScalar)
  totalRevenue!: Prisma.Decimal

  @Field(() => DecimalScalar)
  averageOrderValue!: Prisma.Decimal

  @Field(() => [OrdersReportStatusBreakdownOutput])
  statusBreakdown!: OrdersReportStatusBreakdownOutput[]
}
