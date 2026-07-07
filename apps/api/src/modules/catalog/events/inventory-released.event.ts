export class InventoryReleasedEvent {
  static readonly EVENT_NAME = 'inventory.released' as const

  constructor(
    public readonly orderId: string,
    public readonly items: Array<{ productVariantId: string; quantity: number }>,
  ) {}
}
