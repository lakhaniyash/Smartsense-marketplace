import { Injectable } from '@nestjs/common'

@Injectable()
export class BillingService {
  getStatus(): string {
    return 'billing module initialized'
  }
}
