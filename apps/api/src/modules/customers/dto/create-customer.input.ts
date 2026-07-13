import { CustomerType } from '@prisma/client'
import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator'

@InputType()
export class CreateCustomerInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string

  @Field(() => CustomerType)
  @IsEnum(CustomerType)
  type!: CustomerType

  @Field()
  @IsEmail()
  billingEmail!: string
}
