import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { LoggingService } from '../../../common/services/logging.service'
import { InventoryReleasedEvent } from '../../catalog/events/inventory-released.event'
import { InventoryReservedEvent } from '../../catalog/events/inventory-reserved.event'
import { OrderCancelledEvent } from '../events/order-cancelled.event'
import { OrderConfirmedEvent } from '../events/order-confirmed.event'
import { OrderCreatedEvent } from '../events/order-created.event'

// Proves the M13 event wiring fires exactly once per action — not a real
// feature. M16 Notifications is the intended real consumer of these events;
// this listener should be removed once that lands, not extended.
@Injectable()
export class OrderEventsListener {
  constructor(private readonly logger: LoggingService) {}

  @OnEvent(OrderCreatedEvent.EVENT_NAME)
  handleOrderCreated(event: OrderCreatedEvent): void {
    this.logger.log(
      `Order ${event.orderNumber} created (total ${event.total})`,
      OrderEventsListener.name,
    )
  }

  @OnEvent(OrderConfirmedEvent.EVENT_NAME)
  handleOrderConfirmed(event: OrderConfirmedEvent): void {
    this.logger.log(`Order ${event.orderNumber} confirmed`, OrderEventsListener.name)
  }

  @OnEvent(OrderCancelledEvent.EVENT_NAME)
  handleOrderCancelled(event: OrderCancelledEvent): void {
    this.logger.log(
      `Order ${event.orderNumber} cancelled (was ${event.previousStatus})`,
      OrderEventsListener.name,
    )
  }

  @OnEvent(InventoryReservedEvent.EVENT_NAME)
  handleInventoryReserved(event: InventoryReservedEvent): void {
    this.logger.log(
      `Inventory reserved for order ${event.orderId} (${event.items.length} item(s))`,
      OrderEventsListener.name,
    )
  }

  @OnEvent(InventoryReleasedEvent.EVENT_NAME)
  handleInventoryReleased(event: InventoryReleasedEvent): void {
    this.logger.log(
      `Inventory released for order ${event.orderId} (${event.items.length} item(s))`,
      OrderEventsListener.name,
    )
  }
}
