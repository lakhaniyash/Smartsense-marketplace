import { Field, Int, ObjectType } from '@nestjs/graphql'
import { InventoryReportItemConnectionOutput } from './inventory-report-item-connection.output'

@ObjectType('InventoryReport', {
  description:
    'A point-in-time inventory snapshot for the scoped Partner(s) — no date range, unlike ' +
    "every other report, since stock levels aren't a historical ledger.",
})
export class InventoryReportOutput {
  @Field(() => Int)
  totalVariants!: number

  @Field(() => Int)
  totalOnHand!: number

  @Field(() => Int)
  totalReserved!: number

  @Field(() => Int)
  lowStockCount!: number

  @Field(() => InventoryReportItemConnectionOutput)
  lowStockItems!: InventoryReportItemConnectionOutput
}
