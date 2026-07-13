import { NotificationStatus, NotificationType } from '@prisma/client'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'The domain event that produced this Notification.',
})

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
  description: 'UNREAD until the recipient marks it (or all of theirs) read.',
})

@ObjectType('Notification', {
  description:
    'A recipient-owned, event-sourced notification (docs/domain-model.md § Notification). ' +
    'Never written directly by a resolver — only by NotificationEventsListener reacting to ' +
    'Orders/Billing/Customer-Management domain events.',
})
export class NotificationOutput {
  @Field(() => ID)
  id!: string

  @Field(() => NotificationType)
  type!: NotificationType

  @Field()
  title!: string

  @Field()
  body!: string

  @Field(() => String, { nullable: true })
  entityType!: string | null

  @Field(() => ID, { nullable: true })
  entityId!: string | null

  @Field(() => NotificationStatus)
  status!: NotificationStatus

  @Field(() => Date, { nullable: true })
  readAt!: Date | null

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
