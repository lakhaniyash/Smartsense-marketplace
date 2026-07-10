// Billing's trigger for per-Order invoice generation (docs/domain-model.md
// § Billing Flow: "Order reaches Delivered, return window closes →
// Completed" → "Invoice generated for the Order"). Carries every field
// BillingService.generateInvoiceForOrder needs so it never has to re-query
// the Order. `changedByUserId` is the actor of the DELIVERED→COMPLETED
// transition (the same value already written to
// OrderStatusHistory.changedByUserId for this transition) — AuditLogService
// requires a non-null actorUserId and this codebase has no "system user"
// concept, so the actor has to travel with the event rather than be invented.
export class OrderCompletedEvent {
  static readonly EVENT_NAME = 'order.completed' as const

  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly partnerId: string,
    public readonly total: string,
    public readonly changedByUserId: string,
  ) {}
}
