import type { PaymentMethod } from '@prisma/client'

// Notifications' trigger for "payment recorded" (docs/roadmap.md's v1.1
// notification event set). Only emitted for a freshly created Payment —
// BillingService.recordPayment must never emit this on an idempotent replay
// of an existing payment, since that would double-notify for one payment.
export class PaymentRecordedEvent {
  static readonly EVENT_NAME = 'payment.recorded' as const

  constructor(
    public readonly paymentId: string,
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly partnerId: string,
    public readonly amount: string,
    public readonly method: PaymentMethod,
  ) {}
}
