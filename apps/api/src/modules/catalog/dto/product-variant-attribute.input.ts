import { Field, InputType } from '@nestjs/graphql'
import { IsString, MaxLength, MinLength } from 'class-validator'

@InputType()
export class ProductVariantAttributeInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  key!: string

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  value!: string
}
