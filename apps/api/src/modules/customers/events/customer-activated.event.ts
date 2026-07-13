export class CustomerActivatedEvent {
  static readonly EVENT_NAME = 'customer.activated' as const

  constructor(
    public readonly customerId: string,
    public readonly displayName: string,
  ) {}
}
