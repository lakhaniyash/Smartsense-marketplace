import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { NotificationConnectionOutput } from './dto/notification-connection.output'
import { NotificationFilterInput } from './dto/notification-filter.input'
import { NotificationOutput } from './dto/notification.output'
import { NotificationsService } from './notifications.service'

// No @Permissions(...) anywhere in this resolver — deliberate, per
// docs/authorization.md's addition for Notifications: every operation here
// is ownership-scoped to the caller's own id with zero role
// differentiation (Admin/Partner/Customer all read/manage only their own
// notifications, identically), so there is no verb to gate, only the noun
// (recipientId === user.id), enforced entirely in NotificationsService.
// GqlAuthGuard still requires a valid JWT regardless.
@Resolver()
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationConnectionOutput, {
    name: 'notifications',
    description: "A page of the caller's own notifications, most recent first.",
  })
  notifications(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => NotificationFilterInput, nullable: true })
    filter?: NotificationFilterInput | null,
  ): Promise<NotificationConnectionOutput> {
    return this.notificationsService.findNotifications(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
    })
  }

  @Query(() => Int, {
    name: 'unreadNotificationCount',
    description: "The caller's own unread notification count.",
  })
  unreadNotificationCount(@CurrentUser() user: AuthenticatedUser): Promise<number> {
    return this.notificationsService.unreadCount(user)
  }

  @Mutation(() => NotificationOutput, {
    name: 'markNotificationRead',
    description:
      "Marks one of the caller's own notifications READ. Throws NOT_FOUND on a missing or " +
      'out-of-scope id. Idempotent — already-READ is a no-op.',
  })
  markNotificationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NotificationOutput> {
    return this.notificationsService.markAsRead(user, id)
  }

  @Mutation(() => Int, {
    name: 'markAllNotificationsRead',
    description:
      'Marks every UNREAD notification for the caller as READ; returns the count updated.',
  })
  markAllNotificationsRead(@CurrentUser() user: AuthenticatedUser): Promise<number> {
    return this.notificationsService.markAllAsRead(user)
  }
}
