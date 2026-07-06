import { ProductStatus } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'

@InputType()
export class UpdateProductInput {
  @Field(() => ID)
  @IsUUID()
  id!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @Field({ nullable: true, description: 'Updates the internal singleton ProductVariant.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku?: string

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus
}
