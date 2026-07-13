import { registerEnumType } from '@nestjs/graphql'

export enum RevenueBucketGranularity {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(RevenueBucketGranularity, {
  name: 'RevenueBucketGranularity',
  description: 'Trend bucket size for revenueReport.trend. Defaults to MONTH.',
})
