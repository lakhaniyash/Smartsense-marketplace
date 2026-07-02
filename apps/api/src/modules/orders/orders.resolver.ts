import { Query, Resolver } from '@nestjs/graphql'
import { Public } from '../auth/decorators/public.decorator'
import { OrdersService } from './orders.service'

@Resolver()
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Query(() => String, { name: 'ordersStatus', description: 'Orders module status' })
  ordersStatus(): string {
    return this.ordersService.getStatus()
  }
}
