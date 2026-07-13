import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationType } from '@prisma/client'
import { LoggingService } from '../../../common/services/logging.service'
import { InvoiceGeneratedEvent } from '../../billing/events/invoice-generated.event'
import { PaymentRecordedEvent } from '../../billing/events/payment-recorded.event'
import { CustomerActivatedEvent } from '../../customers/events/customer-activated.event'
import { CustomerArchivedEvent } from '../../customers/events/customer-archived.event'
import { OrderCancelledEvent } from '../../orders/events/order-cancelled.event'
import { OrderCompletedEvent } from '../../orders/events/order-completed.event'
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event'
import { OrderCreatedEvent } from '../../orders/events/order-created.event'
import { NotificationsService } from '../notifications.service'

// The real consumer of Orders' (M13) and Billing's (M16) domain events —
// unlike modules/orders/listeners/order-events.listener.ts (a throwaway M13
// proof-of-wiring listener), this is a real feature and is meant to be
// extended by future providers (email/SMS) subscribing to these same
// events. Every handler is wrapped in `safely()`: `eventEmitter.emit(...)`
// is fire-and-forget and does not propagate an async handler's rejection
// back to the emitting call site, so an uncaught throw here would become a
// bare unhandled-promise-rejection that must never be allowed to affect the
// Order/Invoice/Payment mutation that already committed.
@Injectable()
export class NotificationEventsListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggingService,
  ) {}

  @OnEvent(OrderCreatedEvent.EVENT_NAME)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.safely(OrderCreatedEvent.EVENT_NAME, event.orderNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.ORDER_CREATED,
        title: 'New order received',
        body: `Order ${event.orderNumber} was placed for ${event.total}.`,
        entityType: 'Order',
        entityId: event.orderId,
      })
      await this.notificationsService.notifyCustomerUsers(event.customerId, {
        type: NotificationType.ORDER_CREATED,
        title: 'Order placed',
        body: `Your order ${event.orderNumber} was placed successfully.`,
        entityType: 'Order',
        entityId: event.orderId,
      })
    })
  }

  @OnEvent(OrderConfirmedEvent.EVENT_NAME)
  async handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.safely(OrderConfirmedEvent.EVENT_NAME, event.orderNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Order confirmed',
        body: `Order ${event.orderNumber} was confirmed.`,
        entityType: 'Order',
        entityId: event.orderId,
      })
      await this.notificationsService.notifyCustomerUsers(event.customerId, {
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Order confirmed',
        body: `Your order ${event.orderNumber} was confirmed.`,
        entityType: 'Order',
        entityId: event.orderId,
      })
    })
  }

  @OnEvent(OrderCancelledEvent.EVENT_NAME)
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.safely(OrderCancelledEvent.EVENT_NAME, event.orderNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order cancelled',
        body: `Order ${event.orderNumber} was cancelled${event.reason ? `: ${event.reason}` : '.'}`,
        entityType: 'Order',
        entityId: event.orderId,
      })
      await this.notificationsService.notifyCustomerUsers(event.customerId, {
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order cancelled',
        body: `Your order ${event.orderNumber} was cancelled${event.reason ? `: ${event.reason}` : '.'}`,
        entityType: 'Order',
        entityId: event.orderId,
      })
    })
  }

  // No Customer side: OrderCompletedEvent carries no customerId
  // (BillingService.generateInvoiceForOrder lives with the identical
  // constraint) — re-querying Orders' tables to backfill it would violate
  // the modules/* dependency direction rule, so this is a known, accepted
  // gap for this slice, not an oversight.
  @OnEvent(OrderCompletedEvent.EVENT_NAME)
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    await this.safely(OrderCompletedEvent.EVENT_NAME, event.orderNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.ORDER_COMPLETED,
        title: 'Order completed',
        body: `Order ${event.orderNumber} is complete.`,
        entityType: 'Order',
        entityId: event.orderId,
      })
    })
  }

  @OnEvent(InvoiceGeneratedEvent.EVENT_NAME)
  async handleInvoiceGenerated(event: InvoiceGeneratedEvent): Promise<void> {
    await this.safely(InvoiceGeneratedEvent.EVENT_NAME, event.invoiceNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.INVOICE_GENERATED,
        title: 'Invoice issued',
        body: `Invoice ${event.invoiceNumber} was issued for ${event.amountDue}.`,
        entityType: 'Invoice',
        entityId: event.invoiceId,
      })
    })
  }

  @OnEvent(PaymentRecordedEvent.EVENT_NAME)
  async handlePaymentRecorded(event: PaymentRecordedEvent): Promise<void> {
    await this.safely(PaymentRecordedEvent.EVENT_NAME, event.invoiceNumber, async () => {
      await this.notificationsService.notifyPartnerUsers(event.partnerId, {
        type: NotificationType.PAYMENT_RECORDED,
        title: 'Payment recorded',
        body: `A payment of ${event.amount} was recorded against invoice ${event.invoiceNumber}.`,
        entityType: 'Invoice',
        entityId: event.invoiceId,
      })
    })
  }

  // Customer Management (Sprint 2, SM-328) — not tied to a
  // docs/milestones.md milestone. Notifies only the Customer's own
  // buyer-contact Users (fanOut's existing customerId scope), never
  // Admin/Partner — matches every other "affected party" notification here.
  @OnEvent(CustomerArchivedEvent.EVENT_NAME)
  async handleCustomerArchived(event: CustomerArchivedEvent): Promise<void> {
    await this.safely(CustomerArchivedEvent.EVENT_NAME, event.displayName, async () => {
      await this.notificationsService.notifyCustomerUsers(event.customerId, {
        type: NotificationType.CUSTOMER_ARCHIVED,
        title: 'Account suspended',
        body: `${event.displayName}'s account was suspended. New orders cannot be placed until it's reactivated.`,
        entityType: 'Customer',
        entityId: event.customerId,
      })
    })
  }

  @OnEvent(CustomerActivatedEvent.EVENT_NAME)
  async handleCustomerActivated(event: CustomerActivatedEvent): Promise<void> {
    await this.safely(CustomerActivatedEvent.EVENT_NAME, event.displayName, async () => {
      await this.notificationsService.notifyCustomerUsers(event.customerId, {
        type: NotificationType.CUSTOMER_ACTIVATED,
        title: 'Account reactivated',
        body: `${event.displayName}'s account was reactivated. Orders can be placed again.`,
        entityType: 'Customer',
        entityId: event.customerId,
      })
    })
  }

  private async safely(eventName: string, ref: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
    } catch (error) {
      this.logger.error(
        `Failed to create notification(s) for ${eventName} (${ref}): ${
          error instanceof Error ? error.message : String(error)
        }`,
        undefined,
        NotificationEventsListener.name,
      )
    }
  }
}
