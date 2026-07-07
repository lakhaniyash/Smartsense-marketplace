import type { OrderStatus } from '@prisma/client'

export class OrderCancelledEvent {
  static readonly EVENT_NAME = 'order.cancelled' as const

  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly partnerId: string,
    public readonly previousStatus: OrderStatus,
    public readonly reason: string | null,
  ) {}
}
