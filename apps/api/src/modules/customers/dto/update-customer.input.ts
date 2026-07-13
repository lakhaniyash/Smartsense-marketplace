import { CustomerType } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'

@InputType()
export class UpdateCustomerInput {
  @Field(() => ID)
  @IsUUID()
  id!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName?: string

  @Field(() => CustomerType, { nullable: true })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  billingEmail?: string
}
