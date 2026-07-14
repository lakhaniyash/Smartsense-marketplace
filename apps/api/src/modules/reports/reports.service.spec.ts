import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import {
  BillingReportStatus,
  CustomerStatus,
  CustomerType,
  NotificationStatus,
  OrderStatus,
  Prisma,
  UserStatus,
} from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { ReportsService } from './reports.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: ['reports:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function billingReportFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-1',
    partnerId: 'partner-1',
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-01-31T00:00:00.000Z'),
    grossRevenue: new Prisma.Decimal(1000),
    commissionAmount: new Prisma.Decimal(100),
    netPayout: new Prisma.Decimal(900),
    status: BillingReportStatus.GENERATED,
    generatedAt: new Date('2026-02-01T00:00:00.000Z'),
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  }
}

function partnerFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'partner-1',
    commissionRate: new Prisma.Decimal(10),
    ...overrides,
  }
}

describe('ReportsService', () => {
  let service: ReportsService
  let prisma: {
    billingReport: {
      findMany: jest.Mock
      findUnique: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    partner: { findUnique: jest.Mock; findMany: jest.Mock }
    invoice: { aggregate: jest.Mock; findMany: jest.Mock }
    order: { groupBy: jest.Mock }
    orderItem: { groupBy: jest.Mock }
    productVariant: { count: jest.Mock; findMany: jest.Mock }
    inventory: { aggregate: jest.Mock; findMany: jest.Mock }
    notification: { count: jest.Mock; groupBy: jest.Mock }
    customer: { groupBy: jest.Mock }
    $transaction: jest.Mock
  }
  let auditLogService: { record: jest.Mock }

  beforeEach(() => {
    prisma = {
      billingReport: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      partner: { findUnique: jest.fn(), findMany: jest.fn() },
      invoice: { aggregate: jest.fn(), findMany: jest.fn() },
      order: { groupBy: jest.fn() },
      orderItem: { groupBy: jest.fn() },
      productVariant: { count: jest.fn(), findMany: jest.fn() },
      inventory: { aggregate: jest.fn(), findMany: jest.fn() },
      notification: { count: jest.fn(), groupBy: jest.fn() },
      customer: { groupBy: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    auditLogService = { record: jest.fn() }
    service = new ReportsService(prisma as never, auditLogService as never)
  })

  describe('generateBillingReport — commission math', () => {
    it('pins commissionAmount = grossRevenue * (commissionRate / 100), not grossRevenue * commissionRate', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(
        partnerFixture({ id: 'partner-1', commissionRate: new Prisma.Decimal('10.00') }),
      )
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal('1000.00') },
      })
      prisma.billingReport.create.mockResolvedValueOnce(billingReportFixture())

      await service.generateBillingReport(user({ partnerId: 'partner-1' }), {
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
      })

      const createCall = prisma.billingReport.create.mock.calls[0]?.[0]
      expect((createCall.data.grossRevenue as Prisma.Decimal).toString()).toBe('1000')
      expect((createCall.data.commissionAmount as Prisma.Decimal).toString()).toBe('100')
      expect((createCall.data.netPayout as Prisma.Decimal).toString()).toBe('900')
    })

    it('coalesces a null _sum.amountDue (zero matching invoices) to a valid zero-revenue report', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(
        partnerFixture({ id: 'partner-1', commissionRate: new Prisma.Decimal('15.00') }),
      )
      prisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amountDue: null } })
      prisma.billingReport.create.mockResolvedValueOnce(
        billingReportFixture({
          grossRevenue: new Prisma.Decimal(0),
          commissionAmount: new Prisma.Decimal(0),
          netPayout: new Prisma.Decimal(0),
        }),
      )

      await service.generateBillingReport(user({ partnerId: 'partner-1' }), {
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
      })

      const createCall = prisma.billingReport.create.mock.calls[0]?.[0]
      expect((createCall.data.grossRevenue as Prisma.Decimal).toString()).toBe('0')
      expect((createCall.data.commissionAmount as Prisma.Decimal).toString()).toBe('0')
      expect((createCall.data.netPayout as Prisma.Decimal).toString()).toBe('0')
    })

    it('writes an audit log entry for the generated report', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(partnerFixture())
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal(1000) },
      })
      prisma.billingReport.create.mockResolvedValueOnce(billingReportFixture())

      await service.generateBillingReport(user({ partnerId: 'partner-1' }), {
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
      })

      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ actorUserId: 'user-1', action: 'billing_report.generated' }),
      )
    })
  })

  describe('generateBillingReport — scoping and validation', () => {
    it('uses the caller own partnerId for a Partner caller, ignoring any requested partnerId', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(partnerFixture({ id: 'partner-1' }))
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal(500) },
      })
      prisma.billingReport.create.mockResolvedValueOnce(billingReportFixture())

      await service.generateBillingReport(user({ partnerId: 'partner-1' }), {
        partnerId: 'some-other-partner',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
      })

      expect(prisma.partner.findUnique).toHaveBeenCalledWith({ where: { id: 'partner-1' } })
    })

    it('throws BadRequestException when an Admin omits partnerId', async () => {
      await expect(
        service.generateBillingReport(user({ partnerId: null }), {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.partner.findUnique).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when periodStart is not before periodEnd', async () => {
      await expect(
        service.generateBillingReport(user({ partnerId: 'partner-1' }), {
          periodStart: new Date('2026-01-31'),
          periodEnd: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException when the Partner does not exist', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.generateBillingReport(user({ partnerId: 'partner-1' }), {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('translates a P2002 (exact-duplicate period) to ConflictException', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(partnerFixture())
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal(100) },
      })
      prisma.billingReport.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      )

      await expect(
        service.generateBillingReport(user({ partnerId: 'partner-1' }), {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('translates the GiST overlap exclusion-constraint violation (PrismaClientUnknownRequestError) to ConflictException', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(partnerFixture())
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal(100) },
      })
      prisma.billingReport.create.mockRejectedValueOnce(
        new Prisma.PrismaClientUnknownRequestError(
          'conflicting key value violates exclusion constraint "billing_reports_no_overlapping_periods_excl"',
          { clientVersion: 'test' },
        ),
      )

      await expect(
        service.generateBillingReport(user({ partnerId: 'partner-1' }), {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('rethrows an unrelated error untranslated', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce(partnerFixture())
      prisma.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amountDue: new Prisma.Decimal(100) },
      })
      const unrelated = new Error('connection reset')
      prisma.billingReport.create.mockRejectedValueOnce(unrelated)

      await expect(
        service.generateBillingReport(user({ partnerId: 'partner-1' }), {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow('connection reset')
    })
  })

  describe('findBillingReportById — ownership scoping', () => {
    it("throws NOT_FOUND (not FORBIDDEN) when a Partner requests another Partner's report", async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(
        billingReportFixture({ partnerId: 'other-partner' }),
      )

      await expect(
        service.findBillingReportById(user({ partnerId: 'partner-1' }), 'report-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws NOT_FOUND when the report does not exist', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(null)

      await expect(service.findBillingReportById(user(), 'report-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('returns the mapped report for its own Partner', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(billingReportFixture())

      const result = await service.findBillingReportById(
        user({ partnerId: 'partner-1' }),
        'report-1',
      )

      expect(result.id).toBe('report-1')
    })
  })

  describe('finalizeBillingReport / markBillingReportPaidOut — lifecycle', () => {
    it('moves GENERATED to FINALIZED', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.GENERATED }),
      )
      prisma.billingReport.update.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.FINALIZED }),
      )

      const result = await service.finalizeBillingReport(
        user({ partnerId: 'partner-1' }),
        'report-1',
      )

      expect(prisma.billingReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: BillingReportStatus.FINALIZED },
      })
      expect(result.status).toBe(BillingReportStatus.FINALIZED)
    })

    it('rejects finalizing a report that is not GENERATED', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.FINALIZED }),
      )

      await expect(
        service.finalizeBillingReport(user({ partnerId: 'partner-1' }), 'report-1'),
      ).rejects.toThrow(ConflictException)
      expect(prisma.billingReport.update).not.toHaveBeenCalled()
    })

    it('moves FINALIZED to PAID_OUT', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.FINALIZED }),
      )
      prisma.billingReport.update.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.PAID_OUT }),
      )

      const result = await service.markBillingReportPaidOut(
        user({ partnerId: 'partner-1' }),
        'report-1',
      )

      expect(result.status).toBe(BillingReportStatus.PAID_OUT)
    })

    it('rejects marking a GENERATED (not yet FINALIZED) report as paid out', async () => {
      prisma.billingReport.findUnique.mockResolvedValueOnce(
        billingReportFixture({ status: BillingReportStatus.GENERATED }),
      )

      await expect(
        service.markBillingReportPaidOut(user({ partnerId: 'partner-1' }), 'report-1'),
      ).rejects.toThrow(ConflictException)
      expect(prisma.billingReport.update).not.toHaveBeenCalled()
    })
  })

  describe('revenueReport / ordersReport / inventoryReport — Partner scoping', () => {
    it('rejects a Partner requesting another Partner via revenueReport filter.partnerId', async () => {
      await expect(
        service.getRevenueReport(user({ partnerId: 'partner-1' }), { partnerId: 'other-partner' }),
      ).rejects.toThrow(ForbiddenException)
    })

    it('scopes ordersReport to the Admin-supplied partnerId when given', async () => {
      prisma.order.groupBy.mockResolvedValueOnce([
        {
          status: OrderStatus.COMPLETED,
          _count: { _all: 2 },
          _sum: { total: new Prisma.Decimal(300) },
        },
      ])

      await service.getOrdersReport(user({ partnerId: null }), { partnerId: 'partner-9' })

      expect(prisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ partnerId: 'partner-9' }) as unknown,
        }),
      )
    })

    it('excludes CANCELLED orders from totalRevenue/averageOrderValue', async () => {
      prisma.order.groupBy.mockResolvedValueOnce([
        {
          status: OrderStatus.COMPLETED,
          _count: { _all: 2 },
          _sum: { total: new Prisma.Decimal(300) },
        },
        {
          status: OrderStatus.CANCELLED,
          _count: { _all: 5 },
          _sum: { total: new Prisma.Decimal(1000) },
        },
      ])

      const result = await service.getOrdersReport(user({ partnerId: 'partner-1' }), undefined)

      expect(result.totalOrders).toBe(7)
      expect(result.totalRevenue.toString()).toBe('300')
      expect(result.averageOrderValue.toString()).toBe('150')
    })

    it('returns a zero averageOrderValue when there are no revenue-eligible orders', async () => {
      prisma.order.groupBy.mockResolvedValueOnce([
        {
          status: OrderStatus.CANCELLED,
          _count: { _all: 3 },
          _sum: { total: new Prisma.Decimal(500) },
        },
      ])

      const result = await service.getOrdersReport(user({ partnerId: 'partner-1' }), undefined)

      expect(result.totalRevenue.toString()).toBe('0')
      expect(result.averageOrderValue.toString()).toBe('0')
    })
  })

  describe('customersReport — status/type breakdown', () => {
    it('scopes to the caller-supplied partnerId via the orders relation, not a direct column', async () => {
      prisma.customer.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([])

      await service.getCustomersReport(user({ partnerId: null }), { partnerId: 'partner-9' })

      expect(prisma.customer.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            orders: { some: { partnerId: 'partner-9' } },
          }) as unknown,
        }),
      )
    })

    it("omits the orders relation filter for Admin viewing all partners' customers", async () => {
      prisma.customer.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([])

      await service.getCustomersReport(user({ partnerId: null }), undefined)

      const call = prisma.customer.groupBy.mock.calls[0]?.[0] as { where: Record<string, unknown> }
      expect(call.where).toEqual({ deletedAt: null })
    })

    it('sums totalCustomers from the status breakdown and maps both breakdowns', async () => {
      prisma.customer.groupBy
        .mockResolvedValueOnce([
          { status: CustomerStatus.ACTIVE, _count: { _all: 7 } },
          { status: CustomerStatus.SUSPENDED, _count: { _all: 2 } },
        ])
        .mockResolvedValueOnce([
          { type: CustomerType.INDIVIDUAL, _count: { _all: 5 } },
          { type: CustomerType.ORGANIZATION, _count: { _all: 4 } },
        ])

      const result = await service.getCustomersReport(user({ partnerId: 'partner-1' }), undefined)

      expect(result.totalCustomers).toBe(9)
      expect(result.statusBreakdown).toEqual([
        { status: CustomerStatus.ACTIVE, count: 7 },
        { status: CustomerStatus.SUSPENDED, count: 2 },
      ])
      expect(result.typeBreakdown).toEqual([
        { type: CustomerType.INDIVIDUAL, count: 5 },
        { type: CustomerType.ORGANIZATION, count: 4 },
      ])
    })

    it('rejects a Partner requesting another Partner via filter.partnerId', async () => {
      await expect(
        service.getCustomersReport(user({ partnerId: 'partner-1' }), {
          partnerId: 'other-partner',
        }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('inventoryReport — low-stock filtering', () => {
    it('only counts Inventory rows where quantityOnHand < reorderThreshold', async () => {
      prisma.productVariant.count.mockResolvedValueOnce(3)
      prisma.inventory.aggregate.mockResolvedValueOnce({ _sum: { quantityOnHand: 50 } })
      prisma.inventory.aggregate.mockResolvedValueOnce({ _sum: { quantityReserved: 10 } })
      prisma.inventory.findMany.mockResolvedValueOnce([
        {
          productVariantId: 'variant-low',
          quantityOnHand: 2,
          quantityReserved: 0,
          reorderThreshold: 5,
          productVariant: {
            sku: 'SKU-LOW',
            partnerId: 'partner-1',
            product: { title: 'Low Stock Item' },
          },
        },
        {
          productVariantId: 'variant-ok',
          quantityOnHand: 20,
          quantityReserved: 0,
          reorderThreshold: 5,
          productVariant: {
            sku: 'SKU-OK',
            partnerId: 'partner-1',
            product: { title: 'Well Stocked Item' },
          },
        },
      ])

      const result = await service.getInventoryReport(user({ partnerId: 'partner-1' }), {})

      expect(result.lowStockCount).toBe(1)
      expect(result.lowStockItems.edges).toHaveLength(1)
      expect(result.lowStockItems.edges[0]?.node.sku).toBe('SKU-LOW')
    })
  })

  describe('notificationActivityReport', () => {
    it('scopes to Partner-staff recipients only, never filtering by recipient status/deletedAt', async () => {
      prisma.notification.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4)
      prisma.notification.groupBy.mockResolvedValueOnce([
        { type: 'ORDER_CREATED', _count: { _all: 6 } },
        { type: 'INVOICE_GENERATED', _count: { _all: 4 } },
      ])

      const result = await service.getNotificationActivityReport(
        user({ partnerId: 'partner-1' }),
        undefined,
      )

      expect(result.totalNotifications).toBe(10)
      expect(result.unreadCount).toBe(4)
      expect(result.readCount).toBe(6)
      const [countArgs] = prisma.notification.count.mock.calls
      expect(countArgs?.[0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({ recipient: { partnerId: 'partner-1' } }) as unknown,
        }),
      )
    })

    it('marks notification counts UNREAD not carrying a status filter for the second (unread) count call', async () => {
      prisma.notification.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2)
      prisma.notification.groupBy.mockResolvedValueOnce([])

      await service.getNotificationActivityReport(user({ partnerId: 'partner-1' }), undefined)

      const unreadCallArgs = prisma.notification.count.mock.calls[1]?.[0]
      expect(unreadCallArgs.where).toEqual(
        expect.objectContaining({ status: NotificationStatus.UNREAD }),
      )
    })
  })
})
