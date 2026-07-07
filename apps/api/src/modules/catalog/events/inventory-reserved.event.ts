// Inventory-domain event (M13's first consumer of InventoryService.reserve()),
// emitted by whichever caller owns the transaction — see OrdersService.updateStatus,
// which emits this after its transaction commits, never from inside InventoryService
// itself (an event must never fire before its transaction is known to have succeeded).
export class InventoryReservedEvent {
  static readonly EVENT_NAME = 'inventory.reserved' as const

  constructor(
    public readonly orderId: string,
    public readonly items: Array<{ productVariantId: string; quantity: number }>,
  ) {}
}
