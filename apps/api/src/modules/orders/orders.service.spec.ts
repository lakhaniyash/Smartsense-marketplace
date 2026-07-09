import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrderStatus, ProductVariantStatus, UserStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { InventoryReleasedEvent } from '../catalog/events/inventory-released.event'
import { InventoryReservedEvent } from '../catalog/events/inventory-reserved.event'
import { OrderSortField } from './dto/order-sort.enum'
import { OrderCancelledEvent } from './events/order-cancelled.event'
import { OrderConfirmedEvent } from './events/order-confirmed.event'
import { OrderCreatedEvent } from './events/order-created.event'
import { OrdersService } from './orders.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: ['orders:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function orderFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-0001',
    customerId: 'customer-1',
    partnerId: 'partner-1',
    shippingAddressId: null,
    status: OrderStatus.DRAFT,
    subtotal: new Prisma.Decimal(100),
    tax: new Prisma.Decimal(0),
    shippingCost: new Prisma.Decimal(0),
    total: new Prisma.Decimal(100),
    placedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productVariantId: 'variant-1',
        quantity: 2,
        unitPriceSnapshot: new Prisma.Decimal(50),
        lineTotal: new Prisma.Decimal(100),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        productVariant: {
          id: 'variant-1',
          productId: 'product-1',
          partnerId: 'partner-1',
          sku: 'SKU-1',
          attributes: {},
          price: new Prisma.Decimal(50),
          status: ProductVariantStatus.ACTIVE,
          isDefault: true,
          deletedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          inventory: {
            quantityOnHand: 10,
            quantityReserved: 0,
            reorderThreshold: null,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      },
    ],
    statusHistory: [
      {
        id: 'history-1',
        orderId: 'order-1',
        fromStatus: null,
        toStatus: OrderStatus.DRAFT,
        changedByUserId: 'user-1',
        reason: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    ...overrides,
  }
}

function variantFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'variant-1',
    productId: 'product-1',
    partnerId: 'partner-1',
    sku: 'SKU-1',
    price: new Prisma.Decimal(50),
    deletedAt: null,
    ...overrides,
  }
}

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: {
    order: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock }
    orderStatusHistory: { create: jest.Mock }
    productVariant: { findMany: jest.Mock }
    address: { findUnique: jest.Mock }
    $transaction: jest.Mock
  }
  let eventEmitter: { emit: jest.Mock }
  let inventoryService: { reserve: jest.Mock; release: jest.Mock }
  let auditLogService: { record: jest.Mock }

  beforeEach(() => {
    prisma = {
      order: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      productVariant: { findMany: jest.fn() },
      address: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    eventEmitter = { emit: jest.fn() }
    inventoryService = { reserve: jest.fn(), release: jest.fn() }
    auditLogService = { record: jest.fn() }
    service = new OrdersService(
      prisma as never,
      eventEmitter as never,
      inventoryService as never,
      auditLogService as never,
    )
  })

  describe('findOrderById', () => {
    it('throws NOT_FOUND when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(null)

      await expect(service.findOrderById(user(), 'order-1')).rejects.toThrow(NotFoundException)
    })

    it('throws NOT_FOUND when a Partner requests an order belonging to a different Partner', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ partnerId: 'other-partner' }))

      await expect(
        service.findOrderById(user({ partnerId: 'partner-1' }), 'order-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws NOT_FOUND when a Customer requests an order belonging to a different Customer', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ customerId: 'other-customer' }))

      await expect(
        service.findOrderById(user({ customerId: 'customer-1' }), 'order-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('returns the mapped order for its own Partner', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture())

      const result = await service.findOrderById(user({ partnerId: 'partner-1' }), 'order-1')

      expect(result.id).toBe('order-1')
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.productVariant.sku).toBe('SKU-1')
      expect(result.statusHistory).toHaveLength(1)
    })

    it('Admin (no partnerId/customerId) can read any order', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture())

      const result = await service.findOrderById(user(), 'order-1')

      expect(result.id).toBe('order-1')
    })
  })

  describe('findOrders', () => {
    it("scopes a Partner caller's list to their own partnerId", async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user({ partnerId: 'partner-1' }), {})

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partnerId: 'partner-1' } }),
      )
    })

    it("scopes a Customer caller's list to their own customerId", async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user({ customerId: 'customer-1' }), {})

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: 'customer-1' } }),
      )
    })

    it('lets a Partner narrow their own scope by customerId filter, without escaping it', async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user({ partnerId: 'partner-1' }), {
        filter: { customerId: 'customer-9', partnerId: 'someone-elses-partner' } as never,
      })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partnerId: 'partner-1', customerId: 'customer-9' } }),
      )
    })

    it('applies an explicit partnerId/customerId filter for Admin (no ownership floor)', async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user(), { filter: { partnerId: 'partner-9' } as never })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partnerId: 'partner-9' } }),
      )
    })

    it('sorts by total (with an id tiebreaker) when requested', async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user(), {
        sort: { field: OrderSortField.TOTAL, direction: SortDirection.ASC },
      })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ total: 'asc' }, { id: 'asc' }] }),
      )
    })

    it('defaults to sorting by createdAt (with an id tiebreaker) otherwise', async () => {
      prisma.order.findMany.mockResolvedValueOnce([])

      await service.findOrders(user(), {})

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
      )
    })

    it('computes hasNextPage from an extra fetched row', async () => {
      const rows = [orderFixture({ id: 'a' }), orderFixture({ id: 'b' })]
      prisma.order.findMany.mockResolvedValueOnce(rows)

      const result = await service.findOrders(user(), { first: 1 })

      expect(result.edges).toHaveLength(1)
      expect(result.pageInfo.hasNextPage).toBe(true)
    })
  })

  describe('createOrder', () => {
    it("places the order under the Customer caller's own customerId, ignoring input.customerId", async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([variantFixture()])
      prisma.order.create.mockResolvedValueOnce(
        orderFixture({ id: 'new-order', orderNumber: 'ORD-NEW' }),
      )
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))

      await service.createOrder(user({ customerId: 'customer-1' }), {
        items: [{ productVariantId: 'variant-1', quantity: 2 }],
        customerId: 'someone-elses-customer-id',
      })

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerId: 'customer-1', partnerId: 'partner-1' }),
        }),
      )
    })

    it('scopes the variant lookup to published products for a Customer caller', async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([variantFixture()])
      prisma.order.create.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))

      await service.createOrder(user({ customerId: 'customer-1' }), {
        items: [{ productVariantId: 'variant-1', quantity: 2 }],
      })

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['variant-1'] },
          deletedAt: null,
          product: { status: 'PUBLISHED' },
        },
      })
    })

    it('does not restrict the variant lookup by product status for a Partner/Admin caller', async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([variantFixture()])
      prisma.order.create.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))

      await service.createOrder(user({ partnerId: 'partner-1' }), {
        items: [{ productVariantId: 'variant-1', quantity: 2 }],
        customerId: 'customer-1',
      })

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['variant-1'] }, deletedAt: null },
      })
    })

    it('requires an explicit customerId when the caller is Partner/Admin (placing on behalf)', async () => {
      await expect(
        service.createOrder(user({ partnerId: 'partner-1' }), {
          items: [{ productVariantId: 'variant-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects items spanning more than one Partner', async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([
        variantFixture({ id: 'variant-1', partnerId: 'partner-1' }),
        variantFixture({ id: 'variant-2', partnerId: 'partner-2' }),
      ])

      await expect(
        service.createOrder(user({ customerId: 'customer-1' }), {
          items: [
            { productVariantId: 'variant-1', quantity: 1 },
            { productVariantId: 'variant-2', quantity: 1 },
          ],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it("rejects a Partner caller ordering another Partner's variant", async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([
        variantFixture({ partnerId: 'other-partner' }),
      ])

      await expect(
        service.createOrder(user({ partnerId: 'partner-1' }), {
          items: [{ productVariantId: 'variant-1', quantity: 1 }],
          customerId: 'customer-1',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects a nonexistent product variant', async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([])

      await expect(
        service.createOrder(user({ customerId: 'customer-1' }), {
          items: [{ productVariantId: 'does-not-exist', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it("rejects a shipping address that does not belong to the order's Customer", async () => {
      prisma.address.findUnique.mockResolvedValueOnce({
        id: 'addr-1',
        customerId: 'other-customer',
      })

      await expect(
        service.createOrder(user({ customerId: 'customer-1' }), {
          items: [{ productVariantId: 'variant-1', quantity: 1 }],
          shippingAddressId: 'addr-1',
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.productVariant.findMany).not.toHaveBeenCalled()
    })

    it('server-recomputes subtotal/total from live prices and emits OrderCreated', async () => {
      prisma.productVariant.findMany.mockResolvedValueOnce([
        variantFixture({ price: new Prisma.Decimal(50) }),
      ])
      prisma.order.create.mockResolvedValueOnce(
        orderFixture({ id: 'new-order', orderNumber: 'ORD-NEW', total: new Prisma.Decimal(105) }),
      )
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ id: 'new-order' }))

      await service.createOrder(user({ customerId: 'customer-1' }), {
        items: [{ productVariantId: 'variant-1', quantity: 2 }],
        // A forged client total/subtotal has no field to even land in — only
        // tax/shippingCost are accepted, subtotal/total are always derived.
        tax: '5',
        shippingCost: '0',
      })

      const createCall = prisma.order.create.mock.calls[0]?.[0]
      expect(createCall.data.subtotal.toString()).toBe('100')
      expect(createCall.data.total.toString()).toBe('105')
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        OrderCreatedEvent.EVENT_NAME,
        expect.objectContaining({ orderId: 'new-order', total: '105' }),
      )
    })
  })

  describe('updateStatus', () => {
    it("throws NOT_FOUND when the order is out of the caller's scope", async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ partnerId: 'other-partner' }))

      await expect(
        service.updateStatus(user({ partnerId: 'partner-1' }), 'order-1', OrderStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects a transition not in the matrix', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ status: OrderStatus.DRAFT }))

      await expect(
        service.updateStatus(
          user({ partnerId: 'partner-1', permissions: ['orders:write'] }),
          'order-1',
          OrderStatus.PROCESSING,
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it("lets the order's own Customer confirm it (DRAFT->CONFIRMED), reserving inventory", async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.DRAFT }))
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CONFIRMED }))

      await service.updateStatus(
        user({ customerId: 'customer-1', permissions: ['orders:create'] }),
        'order-1',
        OrderStatus.CONFIRMED,
      )

      expect(inventoryService.reserve).toHaveBeenCalledWith(prisma, [
        { productVariantId: 'variant-1', quantity: 2 },
      ])
      expect(inventoryService.release).not.toHaveBeenCalled()
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.CONFIRMED },
      })
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-1',
          fromStatus: OrderStatus.DRAFT,
          toStatus: OrderStatus.CONFIRMED,
          changedByUserId: 'user-1',
          reason: null,
        },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(prisma, {
        actorUserId: 'user-1',
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'Order',
        entityId: 'order-1',
        metadata: { fromStatus: OrderStatus.DRAFT, toStatus: OrderStatus.CONFIRMED, reason: null },
      })
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InventoryReservedEvent.EVENT_NAME,
        expect.objectContaining({ orderId: 'order-1' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        OrderConfirmedEvent.EVENT_NAME,
        expect.objectContaining({ orderId: 'order-1' }),
      )
    })

    it('rejects a Customer confirming an order (DRAFT->CONFIRMED) without orders:create', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ status: OrderStatus.DRAFT }))

      await expect(
        service.updateStatus(
          user({ customerId: 'customer-1', permissions: ['orders:read'] }),
          'order-1',
          OrderStatus.CONFIRMED,
        ),
      ).rejects.toThrow(ForbiddenException)
      expect(inventoryService.reserve).not.toHaveBeenCalled()
    })

    it('propagates a reservation failure (insufficient stock) without writing the status', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ status: OrderStatus.DRAFT }))
      inventoryService.reserve.mockRejectedValueOnce(
        new BadRequestException('Insufficient available stock'),
      )

      await expect(
        service.updateStatus(
          user({ customerId: 'customer-1', permissions: ['orders:create'] }),
          'order-1',
          OrderStatus.CONFIRMED,
        ),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.order.update).not.toHaveBeenCalled()
      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled()
      expect(auditLogService.record).not.toHaveBeenCalled()
    })

    it('lets the vendor Partner advance CONFIRMED->PROCESSING (no inventory effect)', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CONFIRMED }))
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.PROCESSING }))

      await service.updateStatus(
        user({ partnerId: 'partner-1', permissions: ['orders:create', 'orders:write'] }),
        'order-1',
        OrderStatus.PROCESSING,
      )

      expect(inventoryService.reserve).not.toHaveBeenCalled()
      expect(inventoryService.release).not.toHaveBeenCalled()
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.PROCESSING },
      })
    })

    it('rejects a Customer advancing CONFIRMED->PROCESSING (fulfillment is Partner/Admin only)', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(orderFixture({ status: OrderStatus.CONFIRMED }))

      await expect(
        service.updateStatus(
          user({ customerId: 'customer-1', permissions: ['orders:create'] }),
          'order-1',
          OrderStatus.PROCESSING,
        ),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('cancelOrder', () => {
    it("lets the order's own Customer cancel from DRAFT, without touching inventory", async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.DRAFT }))
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CANCELLED }))

      await service.cancelOrder(
        user({ customerId: 'customer-1', permissions: ['orders:create'] }),
        'order-1',
        'Changed my mind',
      )

      expect(inventoryService.release).not.toHaveBeenCalled()
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-1',
          fromStatus: OrderStatus.DRAFT,
          toStatus: OrderStatus.CANCELLED,
          changedByUserId: 'user-1',
          reason: 'Changed my mind',
        },
      })
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        OrderCancelledEvent.EVENT_NAME,
        expect.objectContaining({ orderId: 'order-1', previousStatus: OrderStatus.DRAFT }),
      )
    })

    it("lets the order's own Customer cancel from CONFIRMED, releasing reserved inventory", async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CONFIRMED }))
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CANCELLED }))

      await service.cancelOrder(
        user({ customerId: 'customer-1', permissions: ['orders:create'] }),
        'order-1',
      )

      expect(inventoryService.release).toHaveBeenCalledWith(prisma, [
        { productVariantId: 'variant-1', quantity: 2 },
      ])
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InventoryReleasedEvent.EVENT_NAME,
        expect.objectContaining({ orderId: 'order-1' }),
      )
    })

    it('rejects a Customer cancelling from PROCESSING (vendor Partner/Admin only)', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(
        orderFixture({ status: OrderStatus.PROCESSING }),
      )

      await expect(
        service.cancelOrder(
          user({ customerId: 'customer-1', permissions: ['orders:create'] }),
          'order-1',
        ),
      ).rejects.toThrow(ForbiddenException)
    })

    it('lets the vendor Partner cancel from PROCESSING, releasing reserved inventory', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(
          orderFixture({ status: OrderStatus.PROCESSING, partnerId: 'partner-1' }),
        )
        .mockResolvedValueOnce(orderFixture({ status: OrderStatus.CANCELLED }))

      await service.cancelOrder(
        user({ partnerId: 'partner-1', permissions: ['orders:create', 'orders:write'] }),
        'order-1',
      )

      expect(inventoryService.release).toHaveBeenCalledWith(prisma, [
        { productVariantId: 'variant-1', quantity: 2 },
      ])
    })
  })
})
