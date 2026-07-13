import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { DateRangeInput } from '../../../common/graphql/date-range.input'

@InputType()
export class ReportsDashboardFilterInput {
  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @Field(() => DateRangeInput, { nullable: true, description: 'Omitted = all time.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeInput)
  dateRange?: DateRangeInput
}
