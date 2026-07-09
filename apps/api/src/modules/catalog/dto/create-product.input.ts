import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { DecimalScalar } from '../../../common/graphql/decimal.scalar'
import { IsPositiveDecimal } from '../../../common/validators/is-positive-decimal.validator'

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
  @MaxLength(5000)
  description?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string

  @Field(() => ID)
  @IsUUID()
  categoryId!: string

  @Field({
    description: "Stored on the Product's initial (default) ProductVariant, unique per Partner.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku!: string

  // Typed `string`, not Prisma.Decimal — see decimal.scalar.ts for why a
  // real Decimal instance can't safely pass through class-transformer.
  @Field(() => DecimalScalar, { description: "The initial default ProductVariant's price." })
  @IsPositiveDecimal()
  price!: string
}
