import { Query, Resolver } from '@nestjs/graphql'
import { type OrdersService } from './orders.service'

@Resolver()
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => String, { name: 'ordersStatus', description: 'Orders module status' })
  ordersStatus(): string {
    return this.ordersService.getStatus()
  }
}
