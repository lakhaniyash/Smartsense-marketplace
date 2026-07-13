import { Field, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'

// First shared-from-day-one filter type in the codebase: every earlier
// date-range field (e.g. OrderFilterInput.createdAfter/createdBefore) was
// inlined per-filter because it only ever had one consumer at the time.
// Reports (M15) introduces 5+ simultaneous consumers (Revenue/Orders/
// Product Performance/Notification Activity/Reports Dashboard filters), so
// this is promoted straight to `common/graphql/` instead of being inlined
// once more (docs/coding-standards.md "promote, don't pre-share" still
// applies — the bar is met here on day one, not retroactively).
@InputType('DateRangeInput', {
  description: 'An inclusive [from, to] date range used to scope a report to a period.',
})
export class DateRangeInput {
  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  from!: Date

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  to!: Date
}
