export class OrderConfirmedEvent {
  static readonly EVENT_NAME = 'order.confirmed' as const

  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly partnerId: string,
  ) {}
}
