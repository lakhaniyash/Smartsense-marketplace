import { Module } from '@nestjs/common'
import { NotificationEventsListener } from './listeners/notification-events.listener'
import { NotificationsResolver } from './notifications.resolver'
import { NotificationsService } from './notifications.service'

@Module({
  providers: [NotificationsResolver, NotificationsService, NotificationEventsListener],
})
export class NotificationsModule {}
