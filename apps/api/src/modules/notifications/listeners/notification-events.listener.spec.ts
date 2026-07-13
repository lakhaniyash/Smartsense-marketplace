import { OrderStatus, PaymentMethod } from '@prisma/client'
import { InvoiceGeneratedEvent } from '../../billing/events/invoice-generated.event'
import { PaymentRecordedEvent } from '../../billing/events/payment-recorded.event'
import { CustomerActivatedEvent } from '../../customers/events/customer-activated.event'
import { CustomerArchivedEvent } from '../../customers/events/customer-archived.event'
import { OrderCancelledEvent } from '../../orders/events/order-cancelled.event'
import { OrderCompletedEvent } from '../../orders/events/order-completed.event'
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event'
import { OrderCreatedEvent } from '../../orders/events/order-created.event'
import { NotificationEventsListener } from './notification-events.listener'

describe('NotificationEventsListener', () => {
  let listener: NotificationEventsListener
  let notificationsService: { notifyPartnerUsers: jest.Mock; notifyCustomerUsers: jest.Mock }
  let logger: { error: jest.Mock }

  beforeEach(() => {
    notificationsService = { notifyPartnerUsers: jest.fn(), notifyCustomerUsers: jest.fn() }
    logger = { error: jest.fn() }
    listener = new NotificationEventsListener(notificationsService as never, logger as never)
  })

  it('notifies both the Partner and Customer on OrderCreated', async () => {
    await listener.handleOrderCreated(
      new OrderCreatedEvent('order-1', 'ORD-1', 'customer-1', 'partner-1', '100'),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ entityId: 'order-1' }),
    )
    expect(notificationsService.notifyCustomerUsers).toHaveBeenCalledWith(
      'customer-1',
      expect.objectContaining({ entityId: 'order-1' }),
    )
  })

  it('notifies both the Partner and Customer on OrderConfirmed', async () => {
    await listener.handleOrderConfirmed(
      new OrderConfirmedEvent('order-1', 'ORD-1', 'customer-1', 'partner-1'),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ entityId: 'order-1' }),
    )
    expect(notificationsService.notifyCustomerUsers).toHaveBeenCalledWith(
      'customer-1',
      expect.objectContaining({ entityId: 'order-1' }),
    )
  })

  it('notifies both the Partner and Customer on OrderCancelled', async () => {
    await listener.handleOrderCancelled(
      new OrderCancelledEvent(
        'order-1',
        'ORD-1',
        'customer-1',
        'partner-1',
        OrderStatus.CONFIRMED,
        'out of stock',
      ),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ body: expect.stringContaining('out of stock') as unknown }),
    )
    expect(notificationsService.notifyCustomerUsers).toHaveBeenCalledWith(
      'customer-1',
      expect.objectContaining({ body: expect.stringContaining('out of stock') as unknown }),
    )
  })

  it('notifies only the Partner on OrderCompleted (no customerId on the event)', async () => {
    await listener.handleOrderCompleted(
      new OrderCompletedEvent('order-1', 'ORD-1', 'partner-1', '100', 'user-1'),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ entityId: 'order-1' }),
    )
    expect(notificationsService.notifyCustomerUsers).not.toHaveBeenCalled()
  })

  it('notifies only the Partner on InvoiceGenerated', async () => {
    await listener.handleInvoiceGenerated(
      new InvoiceGeneratedEvent('invoice-1', 'INV-1', 'order-1', 'ORD-1', 'partner-1', '100'),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ entityId: 'invoice-1', entityType: 'Invoice' }),
    )
    expect(notificationsService.notifyCustomerUsers).not.toHaveBeenCalled()
  })

  it('notifies only the Partner on PaymentRecorded', async () => {
    await listener.handlePaymentRecorded(
      new PaymentRecordedEvent(
        'payment-1',
        'invoice-1',
        'INV-1',
        'partner-1',
        '50',
        PaymentMethod.CARD,
      ),
    )

    expect(notificationsService.notifyPartnerUsers).toHaveBeenCalledWith(
      'partner-1',
      expect.objectContaining({ entityId: 'invoice-1', entityType: 'Invoice' }),
    )
    expect(notificationsService.notifyCustomerUsers).not.toHaveBeenCalled()
  })

  it('notifies only the Customer on CustomerArchived (never Admin/Partner)', async () => {
    await listener.handleCustomerArchived(new CustomerArchivedEvent('customer-1', 'Acme Corp'))

    expect(notificationsService.notifyCustomerUsers).toHaveBeenCalledWith(
      'customer-1',
      expect.objectContaining({ entityId: 'customer-1', entityType: 'Customer' }),
    )
    expect(notificationsService.notifyPartnerUsers).not.toHaveBeenCalled()
  })

  it('notifies only the Customer on CustomerActivated (never Admin/Partner)', async () => {
    await listener.handleCustomerActivated(new CustomerActivatedEvent('customer-1', 'Acme Corp'))

    expect(notificationsService.notifyCustomerUsers).toHaveBeenCalledWith(
      'customer-1',
      expect.objectContaining({ entityId: 'customer-1', entityType: 'Customer' }),
    )
    expect(notificationsService.notifyPartnerUsers).not.toHaveBeenCalled()
  })

  it('swallows a rejected fan-out and logs it, instead of rethrowing', async () => {
    notificationsService.notifyPartnerUsers.mockRejectedValueOnce(new Error('db unavailable'))
    notificationsService.notifyCustomerUsers.mockRejectedValueOnce(new Error('db unavailable'))

    await expect(
      listener.handleOrderCreated(
        new OrderCreatedEvent('order-1', 'ORD-1', 'customer-1', 'partner-1', '100'),
      ),
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('order.created'),
      undefined,
      NotificationEventsListener.name,
    )
  })
})
