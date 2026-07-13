export class CustomerArchivedEvent {
  static readonly EVENT_NAME = 'customer.archived' as const

  constructor(
    public readonly customerId: string,
    public readonly displayName: string,
  ) {}
}
