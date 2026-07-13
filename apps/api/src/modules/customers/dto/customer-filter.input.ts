import { CustomerStatus } from '@prisma/client'
import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString } from 'class-validator'

@InputType()
export class CustomerFilterInput {
  @Field(() => CustomerStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus

  @Field({
    nullable: true,
    description: 'Free-text match against the display name and billing email.',
  })
  @IsOptional()
  @IsString()
  search?: string
}
