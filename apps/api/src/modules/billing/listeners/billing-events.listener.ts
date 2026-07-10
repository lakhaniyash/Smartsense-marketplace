import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { OrderCompletedEvent } from '../../orders/events/order-completed.event'
import { BillingService } from '../billing.service'

// Billing's real trigger for per-Order invoice generation (docs/domain-model.md
// § Billing Flow) — unlike modules/orders/listeners/order-events.listener.ts
// (a throwaway M13 proof-of-wiring listener), this is a real feature and is
// meant to be extended.
@Injectable()
export class BillingEventsListener {
  constructor(private readonly billingService: BillingService) {}

  @OnEvent(OrderCompletedEvent.EVENT_NAME)
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    await this.billingService.generateInvoiceForOrder(event)
  }
}
