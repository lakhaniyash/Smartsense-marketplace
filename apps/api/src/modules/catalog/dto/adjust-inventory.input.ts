import { Field, ID, InputType, Int } from '@nestjs/graphql'
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator'
import { InventoryAdjustmentType } from './inventory-adjustment-type.enum'

@InputType()
export class AdjustInventoryInput {
  @Field(() => ID)
  @IsUUID()
  productVariantId!: string

  @Field(() => InventoryAdjustmentType)
  @IsEnum(InventoryAdjustmentType)
  adjustmentType!: InventoryAdjustmentType

  @Field(() => Int, { description: 'Non-negative. Interpreted per adjustmentType.' })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity!: number

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string
}
