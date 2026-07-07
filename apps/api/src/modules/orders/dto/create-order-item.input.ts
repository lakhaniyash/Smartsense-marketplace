import { Field, ID, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsUUID, Max, Min } from 'class-validator'

@InputType()
export class CreateOrderItemInput {
  @Field(() => ID)
  @IsUUID()
  productVariantId!: string

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number
}
