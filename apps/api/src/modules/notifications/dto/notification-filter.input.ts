import { NotificationStatus } from '@prisma/client'
import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'

@InputType()
export class NotificationFilterInput {
  @Field(() => NotificationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus
}
