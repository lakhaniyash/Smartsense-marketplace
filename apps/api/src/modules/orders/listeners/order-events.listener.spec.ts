import { OrderStatus } from '@prisma/client'
import { InventoryReleasedEvent } from '../../catalog/events/inventory-released.event'
import { InventoryReservedEvent } from '../../catalog/events/inventory-reserved.event'
import { OrderCancelledEvent } from '../events/order-cancelled.event'
import { OrderConfirmedEvent } from '../events/order-confirmed.event'
import { OrderCreatedEvent } from '../events/order-created.event'
import { OrderEventsListener } from './order-events.listener'

describe('OrderEventsListener', () => {
  let listener: OrderEventsListener
  let logger: { log: jest.Mock }

  beforeEach(() => {
    logger = { log: jest.fn() }
    listener = new OrderEventsListener(logger as never)
  })

  it('logs OrderCreated', () => {
    listener.handleOrderCreated(
      new OrderCreatedEvent('order-1', 'ORD-1', 'customer-1', 'partner-1', '100'),
    )
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('ORD-1'),
      OrderEventsListener.name,
    )
  })

  it('logs OrderConfirmed', () => {
    listener.handleOrderConfirmed(
      new OrderConfirmedEvent('order-1', 'ORD-1', 'customer-1', 'partner-1'),
    )
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('ORD-1'),
      OrderEventsListener.name,
    )
  })

  it('logs OrderCancelled', () => {
    listener.handleOrderCancelled(
      new OrderCancelledEvent(
        'order-1',
        'ORD-1',
        'customer-1',
        'partner-1',
        OrderStatus.CONFIRMED,
        'reason',
      ),
    )
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('ORD-1'),
      OrderEventsListener.name,
    )
  })

  it('logs InventoryReserved', () => {
    listener.handleInventoryReserved(
      new InventoryReservedEvent('order-1', [{ productVariantId: 'variant-1', quantity: 2 }]),
    )
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('order-1'),
      OrderEventsListener.name,
    )
  })

  it('logs InventoryReleased', () => {
    listener.handleInventoryReleased(
      new InventoryReleasedEvent('order-1', [{ productVariantId: 'variant-1', quantity: 2 }]),
    )
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('order-1'),
      OrderEventsListener.name,
    )
  })
})
