import { Query, Resolver } from '@nestjs/graphql'
import { type BillingService } from './billing.service'

@Resolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Query(() => String, { name: 'billingStatus', description: 'Billing module status' })
  billingStatus(): string {
    return this.billingService.getStatus()
  }
}
