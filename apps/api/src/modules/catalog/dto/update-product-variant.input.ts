import { ProductVariantStatus } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { IsPositiveDecimal } from '../../../common/validators/is-positive-decimal.validator'
import { ProductVariantAttributeInput } from './product-variant-attribute.input'

@InputType()
export class UpdateProductVariantInput {
  @Field(() => ID)
  @IsUUID()
  id!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku?: string

  @Field(() => [ProductVariantAttributeInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantAttributeInput)
  attributes?: ProductVariantAttributeInput[]

  // Typed `string`, not Prisma.Decimal — see decimal.scalar.ts for why.
  @Field(() => DecimalScalar, { nullable: true })
  @IsOptional()
  @IsPositiveDecimal()
  price?: string

  @Field(() => ProductVariantStatus, {
    nullable: true,
    description:
      'Only DISCONTINUED may be set directly — ACTIVE/OUT_OF_STOCK are derived from ' +
      'Inventory and rejected by the service if supplied here.',
  })
  @IsOptional()
  @IsEnum(ProductVariantStatus)
  status?: ProductVariantStatus

  @Field({
    nullable: true,
    description: "Marks this Variant as the Product's default, unsetting any existing default.",
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}
