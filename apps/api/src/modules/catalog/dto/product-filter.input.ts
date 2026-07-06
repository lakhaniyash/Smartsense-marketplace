import { ProductStatus } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

@InputType()
export class ProductFilterInput {
  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @Field({
    nullable: true,
    description: 'Free-text match against the product title and its SKU.',
  })
  @IsOptional()
  @IsString()
  search?: string
}
