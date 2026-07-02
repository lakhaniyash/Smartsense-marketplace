import { Query, Resolver } from '@nestjs/graphql'
import { Public } from '../auth/decorators/public.decorator'
import { BillingService } from './billing.service'

@Resolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Query(() => String, { name: 'billingStatus', description: 'Billing module status' })
  billingStatus(): string {
    return this.billingService.getStatus()
  }
}
