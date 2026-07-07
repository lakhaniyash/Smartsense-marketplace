// First domain event in the codebase (M13) — see app.module.ts's
// EventEmitterModule.forRoot() comment. M16 Notifications is the intended
// future consumer; today only a logging listener proves the wiring works.
export class OrderCreatedEvent {
  static readonly EVENT_NAME = 'order.created' as const

  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly partnerId: string,
    public readonly total: string,
  ) {}
}
