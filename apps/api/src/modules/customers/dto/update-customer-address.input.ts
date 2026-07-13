import { AddressType } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'

@InputType()
export class UpdateCustomerAddressInput {
  @Field(() => ID)
  @IsUUID()
  id!: string

  @Field(() => AddressType, { nullable: true })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  line1?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postalCode?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country?: string

  @Field({
    nullable: true,
    description: "Marks this address as the Customer's default, unsetting any existing default.",
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}
