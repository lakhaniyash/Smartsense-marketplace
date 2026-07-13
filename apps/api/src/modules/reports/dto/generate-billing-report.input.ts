import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsDate, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class GenerateBillingReportInput {
  @Field(() => ID, {
    nullable: true,
    description:
      'Required for an Admin caller (there is no "generate for all partners" bulk operation); ' +
      'ignored for a Partner caller, whose own partnerId always wins.',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  periodStart!: Date

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  periodEnd!: Date
}
