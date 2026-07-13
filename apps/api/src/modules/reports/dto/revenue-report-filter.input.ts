import { Field, ID, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { DateRangeInput } from '../../../common/graphql/date-range.input'
import { RevenueBucketGranularity } from './revenue-bucket-granularity.enum'

@InputType()
export class RevenueReportFilterInput {
  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @Field(() => DateRangeInput, {
    nullable: true,
    description: 'Scopes to Invoice.issuedAt within this range. Omitted = all time.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeInput)
  dateRange?: DateRangeInput

  @Field(() => RevenueBucketGranularity, { nullable: true, description: 'Defaults to MONTH.' })
  @IsOptional()
  @IsEnum(RevenueBucketGranularity)
  granularity?: RevenueBucketGranularity
}
