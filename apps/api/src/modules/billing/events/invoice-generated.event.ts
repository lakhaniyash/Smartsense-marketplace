// Notifications' trigger for "invoice issued" (docs/roadmap.md's v1.1
// notification event set). Carries every field NotificationsService needs
// so it never has to re-query the Invoice or Order.
export class InvoiceGeneratedEvent {
  static readonly EVENT_NAME = 'invoice.generated' as const

  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly partnerId: string,
    public readonly amountDue: string,
  ) {}
}
