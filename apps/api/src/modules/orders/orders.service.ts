import { Injectable } from '@nestjs/common'

@Injectable()
export class OrdersService {
  getStatus(): string {
    return 'orders module initialized'
  }
}
