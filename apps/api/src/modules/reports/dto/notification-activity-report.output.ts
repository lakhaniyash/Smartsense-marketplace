import { Field, Int, ObjectType } from '@nestjs/graphql'
import { NotificationActivityTypeBreakdownOutput } from './notification-activity-type-breakdown.output'

@ObjectType('NotificationActivityReport', {
  description:
    "Historical Notification volume for the scoped Partner's staff recipients, regardless of " +
    "current recipient status/deletedAt — a report reflects what happened, not who's still " +
    "active today (unlike NotificationsService.notifyPartnerUsers' fan-out filter).",
})
export class NotificationActivityReportOutput {
  @Field(() => Int)
  totalNotifications!: number

  @Field(() => Int)
  unreadCount!: number

  @Field(() => Int)
  readCount!: number

  @Field(() => [NotificationActivityTypeBreakdownOutput])
  typeBreakdown!: NotificationActivityTypeBreakdownOutput[]
}
