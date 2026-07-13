import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsUUID } from 'class-validator'

// Deliberately no dateRange field: Inventory is a point-in-time snapshot
// (current quantityOnHand/quantityReserved), not a historical ledger, so a
// date-scoped filter would have nothing meaningful to scope.
@InputType()
export class InventoryReportFilterInput {
  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string
}
