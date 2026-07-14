import { UserOwnerType, UserStatus } from '@prisma/client'
import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString } from 'class-validator'

@InputType()
export class UserFilterInput {
  @Field(() => UserStatus, { nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @Field(() => UserOwnerType, { nullable: true })
  @IsOptional()
  @IsEnum(UserOwnerType)
  ownerType?: UserOwnerType

  @Field({
    nullable: true,
    description: 'Free-text match against email and full name.',
  })
  @IsOptional()
  @IsString()
  search?: string
}
