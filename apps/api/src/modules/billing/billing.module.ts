import { Module } from '@nestjs/common'
import { BillingEventsListener } from './listeners/billing-events.listener'
import { BillingResolver } from './billing.resolver'
import { BillingService } from './billing.service'

@Module({
  providers: [BillingResolver, BillingService, BillingEventsListener],
})
export class BillingModule {}
