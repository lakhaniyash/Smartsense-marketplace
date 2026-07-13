import { BillingReportStatus } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class BillingReportFilterInput {
  @Field(() => BillingReportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(BillingReportStatus)
  status?: BillingReportStatus

  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string
}
