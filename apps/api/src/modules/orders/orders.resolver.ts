import { OrderStatus } from '@prisma/client'
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { CreateOrderInput } from './dto/create-order.input'
import { OrderConnectionOutput } from './dto/order-connection.output'
import { OrderFilterInput } from './dto/order-filter.input'
import { OrderSortInput } from './dto/order-sort.input'
import { OrderOutput } from './dto/order.output'
import { OrdersService } from './orders.service'

@Resolver()
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Query(() => String, { name: 'ordersStatus', description: 'Orders module status' })
  ordersStatus(): string {
    return this.ordersService.getStatus()
  }

  @Permissions('orders:read')
  @Query(() => OrderConnectionOutput, {
    name: 'orders',
    description:
      "A page of the caller's visible orders (Admin: all; Partner: own as vendor; Customer: own as buyer).",
  })
  orders(
    @CurrentUser() user: AuthenticatedUser,
    // See CatalogResolver.products for why every arg admits null as well as
    // undefined — same exactOptionalPropertyTypes reasoning applies here.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => OrderFilterInput, nullable: true })
    filter?: OrderFilterInput | null,
    @Args('sort', { type: () => OrderSortInput, nullable: true }) sort?: OrderSortInput | null,
  ): Promise<OrderConnectionOutput> {
    return this.ordersService.findOrders(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('orders:read')
  @Query(() => OrderOutput, {
    name: 'order',
    description:
      'A single order by id, scoped to the caller. Throws NOT_FOUND rather than returning ' +
      'null on a missing or out-of-scope id.',
  })
  order(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderOutput> {
    return this.ordersService.findOrderById(user, id)
  }

  @Permissions('orders:create')
  @Mutation(() => OrderOutput, {
    name: 'createOrder',
    description:
      'Places a new Order in DRAFT status for the caller (Customer: self; Partner/Admin: on ' +
      'behalf of a specified customerId). No inventory effect yet — reservation happens when ' +
      'the order is confirmed via updateOrderStatus.',
  })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderOutput> {
    return this.ordersService.createOrder(user, input)
  }

  // Floor is orders:create — the loosest permission any transition this
  // mutation drives requires (DRAFT→CONFIRMED). OrdersService.updateStatus
  // re-derives and enforces the row-specific permission (e.g. orders:write
  // for CONFIRMED→PROCESSING) — see its own doc comment.
  @Permissions('orders:create')
  @Mutation(() => OrderOutput, {
    name: 'updateOrderStatus',
    description:
      'Transitions an Order to a new status per the allowed transition matrix ' +
      '(docs/authorization.md § Orders). Rejects any other requested transition as invalid.',
  })
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Args('reason', { type: () => String, nullable: true }) reason?: string | null,
  ): Promise<OrderOutput> {
    return this.ordersService.updateStatus(user, id, status, reason ?? undefined)
  }

  @Permissions('orders:create')
  @Mutation(() => OrderOutput, {
    name: 'cancelOrder',
    description:
      "Cancels an Order (caller's own order from DRAFT/CONFIRMED; vendor Partner/Admin only " +
      'from PROCESSING). Releases any reserved inventory.',
  })
  cancelOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { type: () => String, nullable: true }) reason?: string | null,
  ): Promise<OrderOutput> {
    return this.ordersService.cancelOrder(user, id, reason ?? undefined)
  }
}
