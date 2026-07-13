import { NotificationType } from '@prisma/client'
import { Field, Int, ObjectType } from '@nestjs/graphql'

// NotificationType is already registered as a GraphQL enum by
// modules/notifications/dto/notification.output.ts (NotificationsModule
// loads ahead of ReportsModule in app.module.ts) — this file only imports
// and references it, it does not re-register it.
@ObjectType('NotificationActivityTypeBreakdown', {
  description: 'Notification count for a single NotificationType within the scoped period.',
})
export class NotificationActivityTypeBreakdownOutput {
  @Field(() => NotificationType)
  type!: NotificationType

  @Field(() => Int)
  count!: number
}
