import { randomUUID } from 'crypto'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { OrderStatus, Prisma } from '@prisma/client'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.util'
import { InventoryReleasedEvent } from '../catalog/events/inventory-released.event'
import { InventoryReservedEvent } from '../catalog/events/inventory-reserved.event'
import { InventoryService } from '../catalog/inventory.service'
import { mapVariantToOutput } from '../catalog/mappers/product-variant.mapper'
import { CreateOrderInput } from './dto/create-order.input'
import { OrderConnectionOutput, OrderEdgeOutput } from './dto/order-connection.output'
import { OrderFilterInput } from './dto/order-filter.input'
import { OrderSortField } from './dto/order-sort.enum'
import { OrderSortInput } from './dto/order-sort.input'
import { OrderOutput } from './dto/order.output'
import { OrderCancelledEvent } from './events/order-cancelled.event'
import { OrderCompletedEvent } from './events/order-completed.event'
import { OrderConfirmedEvent } from './events/order-confirmed.event'
import { OrderCreatedEvent } from './events/order-created.event'

const DEFAULT_PAGE_SIZE = 20

export const ORDER_INCLUDE = {
  items: {
    include: { productVariant: { include: { inventory: true } } },
  },
  statusHistory: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>

export interface FindOrdersArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: OrderFilterInput | undefined
  sort?: OrderSortInput | undefined
}

interface OrderTransitionRule {
  from: OrderStatus
  to: OrderStatus
  requiredPermission: string
  reserveInventory: boolean
  releaseInventory: boolean
}

// The transition matrix (see the plan's rationale, mirrored in
// docs/authorization.md § Orders). M13 landed the first five transitions;
// M14 (Billing) wires PROCESSING→SHIPPED→DELIVERED→COMPLETED so Billing's
// invoice-generation trigger (OrderCompletedEvent, emitted on reaching
// COMPLETED) is reachable. The OrderStatus enum still has values beyond
// these (PENDING_PAYMENT, RETURN_REQUESTED, REFUNDED) reserved for future
// milestones — any other requested transition is rejected below as
// invalid, not silently allowed.
const ORDER_TRANSITIONS: OrderTransitionRule[] = [
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.CONFIRMED,
    requiredPermission: 'orders:create',
    reserveInventory: true,
    releaseInventory: false,
  },
  {
    from: OrderStatus.CONFIRMED,
    to: OrderStatus.PROCESSING,
    requiredPermission: 'orders:write',
    reserveInventory: false,
    releaseInventory: false,
  },
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.CANCELLED,
    requiredPermission: 'orders:create',
    reserveInventory: false,
    releaseInventory: false,
  },
  {
    from: OrderStatus.CONFIRMED,
    to: OrderStatus.CANCELLED,
    requiredPermission: 'orders:create',
    reserveInventory: false,
    releaseInventory: true,
  },
  {
    from: OrderStatus.PROCESSING,
    to: OrderStatus.CANCELLED,
    requiredPermission: 'orders:write',
    reserveInventory: false,
    releaseInventory: true,
  },
  {
    from: OrderStatus.PROCESSING,
    to: OrderStatus.SHIPPED,
    requiredPermission: 'orders:write',
    reserveInventory: false,
    releaseInventory: false,
  },
  {
    from: OrderStatus.SHIPPED,
    to: OrderStatus.DELIVERED,
    requiredPermission: 'orders:write',
    reserveInventory: false,
    releaseInventory: false,
  },
  {
    from: OrderStatus.DELIVERED,
    to: OrderStatus.COMPLETED,
    requiredPermission: 'orders:write',
    reserveInventory: false,
    releaseInventory: false,
  },
]

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  getStatus(): string {
    return 'orders module initialized'
  }

  async findOrders(user: AuthenticatedUser, args: FindOrdersArgs): Promise<OrderConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildWhere(user, args.filter)
    const orderBy = this.buildOrderBy(args.sort)

    const rows = await this.prisma.order.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: decodeCursor(after) },
        skip: 1,
      }),
      include: ORDER_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: OrderEdgeOutput[] = page.map((order) => ({
      cursor: encodeCursor(order.id),
      node: this.mapOrderToOutput(order),
    }))

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: after !== undefined,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    }
  }

  async findOrderById(user: AuthenticatedUser, id: string): Promise<OrderOutput> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE })

    // Ownership miss reads as NOT_FOUND, never FORBIDDEN (docs/authorization.md
    // § Ownership Rules) — same pattern as CatalogService.findProductById.
    if (
      order === null ||
      (user.partnerId !== null && order.partnerId !== user.partnerId) ||
      (user.customerId !== null && order.customerId !== user.customerId)
    ) {
      throw new NotFoundException('Order not found')
    }

    return this.mapOrderToOutput(order)
  }

  /**
   * Places an Order in DRAFT status — no inventory effect yet (reservation
   * happens at the DRAFT→CONFIRMED transition, see OrdersService.updateStatus).
   * Ownership is never client-supplied for a Customer caller (their own
   * customerId always wins); a Partner/Admin caller must supply one
   * (docs/authorization.md § Ownership Rules — "on behalf of" placement).
   * `partnerId` is derived from the ordered ProductVariants, never accepted
   * as input, and every item must share the same one (single-partner-order
   * invariant, docs/database-schema.md § Constraints Not Enforceable).
   * `subtotal`/`total` are always server-recomputed from live Variant prices,
   * never trusted from the client (docs/api-conventions.md § Validation).
   */
  async createOrder(user: AuthenticatedUser, input: CreateOrderInput): Promise<OrderOutput> {
    const customerId = this.resolveCustomerId(user, input)

    if (input.shippingAddressId !== undefined) {
      await this.assertShippingAddressOwnedByCustomer(input.shippingAddressId, customerId)
    }

    const variantIds = input.items.map((item) => item.productVariantId)
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        deletedAt: null,
        // A Customer (no owning Partner) can only order published products
        // — same visibility floor as CatalogService.buildWhere/findProductById
        // (docs/authorization.md § Ownership Rules). A missing variant here
        // reads as "does not exist" below, the same as an actually-missing
        // one, rather than leaking that an unpublished match was found.
        ...(user.partnerId === null &&
          user.customerId !== null && { product: { status: 'PUBLISHED' } }),
      },
    })
    if (variants.length !== new Set(variantIds).size) {
      throw new BadRequestException('One or more product variants do not exist')
    }

    const partnerIds = new Set(variants.map((variant) => variant.partnerId))
    if (partnerIds.size > 1) {
      throw new BadRequestException('All items in an order must belong to a single Partner')
    }
    const [partnerId] = [...partnerIds]
    if (partnerId === undefined) {
      throw new BadRequestException('An order must contain at least one item')
    }
    if (user.partnerId !== null && user.partnerId !== partnerId) {
      throw new BadRequestException("Cannot place an order for another Partner's products")
    }

    const variantById = new Map(variants.map((variant) => [variant.id, variant]))
    const lineItems = input.items.map((item) => {
      const variant = variantById.get(item.productVariantId)
      if (variant === undefined) {
        throw new BadRequestException('One or more product variants do not exist')
      }
      const unitPriceSnapshot = variant.price
      const lineTotal = unitPriceSnapshot.times(item.quantity)
      return {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitPriceSnapshot,
        lineTotal,
      }
    })

    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(item.lineTotal),
      new Prisma.Decimal(0),
    )
    const tax = input.tax !== undefined ? new Prisma.Decimal(input.tax) : new Prisma.Decimal(0)
    const shippingCost =
      input.shippingCost !== undefined
        ? new Prisma.Decimal(input.shippingCost)
        : new Prisma.Decimal(0)
    const total = subtotal.plus(tax).plus(shippingCost)

    let created
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: this.generateOrderNumber(),
            customerId,
            partnerId,
            shippingAddressId: input.shippingAddressId ?? null,
            subtotal,
            tax,
            shippingCost,
            total,
            placedAt: new Date(),
            items: { create: lineItems },
            statusHistory: {
              create: [{ toStatus: 'DRAFT', changedByUserId: user.id }],
            },
          },
        })
        return order
      })
    } catch (error) {
      this.translatePrismaError(error)
    }

    this.eventEmitter.emit(
      OrderCreatedEvent.EVENT_NAME,
      new OrderCreatedEvent(
        created.id,
        created.orderNumber,
        created.customerId,
        created.partnerId,
        total.toString(),
      ),
    )

    return this.findOrderById(user, created.id)
  }

  /**
   * Drives every status transition (including cancellation) through the
   * ORDER_TRANSITIONS matrix. The resolver-level @Permissions decorator is
   * only a floor (the loosest permission any row needs); this method
   * re-derives and enforces the row-specific permission, so e.g. a Customer
   * (holds orders:create) is correctly rejected from PROCESSING→CANCELLED
   * (requires orders:write) despite passing the resolver's guard.
   * Ownership and inventory reserve/release are atomic with the status
   * write and history row (docs/api-conventions.md § Transactions).
   */
  async updateStatus(
    user: AuthenticatedUser,
    orderId: string,
    targetStatus: OrderStatus,
    reason?: string,
  ): Promise<OrderOutput> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    })
    if (
      order === null ||
      (user.partnerId !== null && order.partnerId !== user.partnerId) ||
      (user.customerId !== null && order.customerId !== user.customerId)
    ) {
      throw new NotFoundException('Order not found')
    }

    const rule = ORDER_TRANSITIONS.find(
      (candidate) => candidate.from === order.status && candidate.to === targetStatus,
    )
    if (rule === undefined) {
      throw new BadRequestException(
        `Cannot transition an order from ${order.status} to ${targetStatus}`,
      )
    }
    if (!user.permissions.includes(rule.requiredPermission)) {
      throw new ForbiddenException(`Requires permission: ${rule.requiredPermission}`)
    }

    const items = order.items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
    }))
    const previousStatus = order.status

    await this.prisma.$transaction(async (tx) => {
      if (rule.reserveInventory) await this.inventoryService.reserve(tx, items)
      if (rule.releaseInventory) await this.inventoryService.release(tx, items)
      await tx.order.update({ where: { id: orderId }, data: { status: targetStatus } })
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: previousStatus,
          toStatus: targetStatus,
          changedByUserId: user.id,
          reason: reason ?? null,
        },
      })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'Order',
        entityId: orderId,
        metadata: { fromStatus: previousStatus, toStatus: targetStatus, reason: reason ?? null },
      })
    })

    this.emitTransitionEvents(order, targetStatus, rule, items, reason, user.id)

    return this.findOrderById(user, orderId)
  }

  /** Sugar over updateStatus targeting CANCELLED — see docs/ui-guidelines.md's
   *  requirement that cancellation be its own confirmable action. */
  cancelOrder(user: AuthenticatedUser, orderId: string, reason?: string): Promise<OrderOutput> {
    return this.updateStatus(user, orderId, OrderStatus.CANCELLED, reason)
  }

  private emitTransitionEvents(
    order: OrderWithRelations,
    targetStatus: OrderStatus,
    rule: OrderTransitionRule,
    items: Array<{ productVariantId: string; quantity: number }>,
    reason: string | undefined,
    changedByUserId: string,
  ): void {
    if (rule.reserveInventory) {
      this.eventEmitter.emit(
        InventoryReservedEvent.EVENT_NAME,
        new InventoryReservedEvent(order.id, items),
      )
    }
    if (rule.releaseInventory) {
      this.eventEmitter.emit(
        InventoryReleasedEvent.EVENT_NAME,
        new InventoryReleasedEvent(order.id, items),
      )
    }
    if (targetStatus === OrderStatus.CONFIRMED) {
      this.eventEmitter.emit(
        OrderConfirmedEvent.EVENT_NAME,
        new OrderConfirmedEvent(order.id, order.orderNumber, order.customerId, order.partnerId),
      )
    }
    if (targetStatus === OrderStatus.CANCELLED) {
      this.eventEmitter.emit(
        OrderCancelledEvent.EVENT_NAME,
        new OrderCancelledEvent(
          order.id,
          order.orderNumber,
          order.customerId,
          order.partnerId,
          order.status,
          reason ?? null,
        ),
      )
    }
    if (targetStatus === OrderStatus.COMPLETED) {
      this.eventEmitter.emit(
        OrderCompletedEvent.EVENT_NAME,
        new OrderCompletedEvent(
          order.id,
          order.orderNumber,
          order.partnerId,
          order.total.toString(),
          changedByUserId,
        ),
      )
    }
  }

  /**
   * A Customer caller always places their own order — never a client-supplied
   * id. A Partner/Admin caller is placing on the customer's behalf and must
   * supply one explicitly.
   */
  private resolveCustomerId(user: AuthenticatedUser, input: CreateOrderInput): string {
    if (user.customerId !== null) return user.customerId
    if (input.customerId === undefined) {
      throw new BadRequestException(
        'customerId is required when placing an order on behalf of a Customer',
      )
    }
    return input.customerId
  }

  private async assertShippingAddressOwnedByCustomer(
    shippingAddressId: string,
    customerId: string,
  ): Promise<void> {
    const address = await this.prisma.address.findUnique({ where: { id: shippingAddressId } })
    if (address === null || address.customerId !== customerId) {
      throw new BadRequestException("Shipping address does not belong to this order's Customer")
    }
  }

  private generateOrderNumber(): string {
    return `ORD-${randomUUID().split('-')[0]?.toUpperCase()}`
  }

  private translatePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException('Order number collision, retry')
      if (error.code === 'P2003') throw new BadRequestException('Referenced record does not exist')
    }
    throw error
  }

  /**
   * Ownership derives from the caller's own provisioned organization
   * (docs/authorization.md § Ownership Rules): a Partner-scoped caller is
   * always floored to their own partnerId, a Customer-scoped caller to their
   * own customerId, and Admin (both null) sees everything. The filter's
   * partnerId/customerId fields can only narrow further within that floor —
   * see OrderFilterInput's field descriptions.
   */
  private buildWhere(
    user: AuthenticatedUser,
    filter: OrderFilterInput | undefined,
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {}

    // Every OrderFilterInput field is `nullable: true` in the GraphQL
    // schema, so a well-formed client can legitimately send `null` rather
    // than omitting the key — `?? undefined` normalizes both to "not
    // provided" once, here (same defensive normalization CatalogService's
    // buildWhere applies, after the same class of bug surfaced there).
    const partnerId = filter?.partnerId ?? undefined
    const customerId = filter?.customerId ?? undefined
    const status = filter?.status ?? undefined
    const createdAfter = filter?.createdAfter ?? undefined
    const createdBefore = filter?.createdBefore ?? undefined

    if (user.partnerId !== null) {
      where.partnerId = user.partnerId
      if (customerId !== undefined) where.customerId = customerId
    } else if (user.customerId !== null) {
      where.customerId = user.customerId
      if (partnerId !== undefined) where.partnerId = partnerId
    } else {
      if (partnerId !== undefined) where.partnerId = partnerId
      if (customerId !== undefined) where.customerId = customerId
    }

    if (status !== undefined) where.status = status
    if (createdAfter !== undefined || createdBefore !== undefined) {
      where.createdAt = {
        ...(createdAfter !== undefined && { gte: createdAfter }),
        ...(createdBefore !== undefined && { lte: createdBefore }),
      }
    }

    return where
  }

  // `id` breaks ties: two rows sharing the exact same total/createdAt could
  // otherwise skip or repeat across cursor-paginated pages, since Prisma's
  // cursor pagination requires orderBy to fully determine a total order.
  private buildOrderBy(sort: OrderSortInput | undefined): Prisma.OrderOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === OrderSortField.TOTAL) return [{ total: direction }, { id: 'asc' }]
    return [{ createdAt: direction }, { id: 'asc' }]
  }

  mapOrderToOutput(order: OrderWithRelations): OrderOutput {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      partnerId: order.partnerId,
      shippingAddressId: order.shippingAddressId,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        productVariant: mapVariantToOutput(item.productVariant),
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
        lineTotal: item.lineTotal,
      })),
      statusHistory: order.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedByUserId: entry.changedByUserId,
        reason: entry.reason,
        createdAt: entry.createdAt,
      })),
      placedAt: order.placedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }
}
