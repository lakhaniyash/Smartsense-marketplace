import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string

  @Field(() => ID)
  @IsUUID()
  categoryId!: string

  @Field({ description: 'Stored on the internal singleton ProductVariant, unique per Partner.' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku!: string
}
