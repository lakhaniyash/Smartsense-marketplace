import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CustomerStatus, CustomerType, InvoiceStatus, Prisma, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { CustomerSortField } from './dto/customer-sort.enum'
import { CustomersService } from './customers.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: ['customers:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function customerFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'customer-1',
    displayName: 'Acme Corp',
    type: CustomerType.ORGANIZATION,
    status: CustomerStatus.ACTIVE,
    billingEmail: 'yash.lakhani+acme@smartsensesolutions.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    addresses: [
      {
        id: 'address-1',
        type: 'BILLING',
        line1: '1 Market St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
        isDefault: true,
      },
    ],
    users: [
      {
        id: 'buyer-user-1',
        email: 'yash.lakhani+buyer@smartsensesolutions.com',
        fullName: 'Buyer Contact',
        status: UserStatus.ACTIVE,
      },
    ],
    ...overrides,
  }
}

describe('CustomersService', () => {
  let service: CustomersService
  let prisma: {
    customer: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock }
    order: { count: jest.Mock }
    invoice: { findMany: jest.Mock }
    $transaction: jest.Mock
  }
  let auditLogService: { record: jest.Mock; findForEntity: jest.Mock }
  let eventEmitter: { emit: jest.Mock }

  beforeEach(() => {
    prisma = {
      customer: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      order: { count: jest.fn().mockResolvedValue(0) },
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    auditLogService = { record: jest.fn(), findForEntity: jest.fn() }
    eventEmitter = { emit: jest.fn() }
    service = new CustomersService(prisma as never, auditLogService as never, eventEmitter as never)
  })

  describe('findCustomerById', () => {
    it('throws NOT_FOUND when the customer does not exist', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(null)

      await expect(service.findCustomerById(user(), 'customer-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it("scopes the lookup to a Partner's permitted customers (has a shared Order)", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.findCustomerById(user({ partnerId: 'partner-1' }), 'customer-1'),
      ).rejects.toThrow(NotFoundException)

      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'customer-1',
            deletedAt: null,
            orders: { some: { partnerId: 'partner-1' } },
          }),
        }),
      )
    })

    it('Admin (no partnerId) can read any customer, unscoped by Order', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture())

      const result = await service.findCustomerById(user(), 'customer-1')

      expect(result.id).toBe('customer-1')
      expect(result.addresses).toHaveLength(1)
      expect(result.assignedUsers).toHaveLength(1)
      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'customer-1', deletedAt: null },
        }),
      )
    })

    it("scopes the billing summary to the Partner's own invoices, never the whole Customer", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture())
      prisma.order.count.mockResolvedValueOnce(2)
      prisma.invoice.findMany.mockResolvedValueOnce([
        { amountDue: new Prisma.Decimal(100), status: InvoiceStatus.PAID, payments: [] },
        { amountDue: new Prisma.Decimal(50), status: InvoiceStatus.ISSUED, payments: [] },
      ])

      const result = await service.findCustomerById(user({ partnerId: 'partner-1' }), 'customer-1')

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order: { customerId: 'customer-1', partnerId: 'partner-1' } },
        }),
      )
      expect(result.billingSummary?.totalOrders).toBe(2)
      expect(result.billingSummary?.totalInvoiced.toString()).toBe('150')
      expect(result.billingSummary?.totalOutstanding.toString()).toBe('50')
    })

    it("nets SUCCEEDED payments against a PARTIALLY_PAID invoice's outstanding balance", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture())
      prisma.order.count.mockResolvedValueOnce(1)
      prisma.invoice.findMany.mockResolvedValueOnce([
        {
          amountDue: new Prisma.Decimal(100),
          status: InvoiceStatus.PARTIALLY_PAID,
          payments: [{ amount: new Prisma.Decimal(30) }, { amount: new Prisma.Decimal(20) }],
        },
      ])

      const result = await service.findCustomerById(user(), 'customer-1')

      expect(result.billingSummary?.totalInvoiced.toString()).toBe('100')
      expect(result.billingSummary?.totalOutstanding.toString()).toBe('50')
    })

    it('ignores non-SUCCEEDED payments when netting outstanding balance', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture())
      prisma.order.count.mockResolvedValueOnce(1)
      prisma.invoice.findMany.mockResolvedValueOnce([
        { amountDue: new Prisma.Decimal(100), status: InvoiceStatus.ISSUED, payments: [] },
      ])

      const result = await service.findCustomerById(user(), 'customer-1')

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            payments: { where: { status: 'SUCCEEDED' }, select: { amount: true } },
          }),
        }),
      )
      expect(result.billingSummary?.totalOutstanding.toString()).toBe('100')
    })

    it('billingSummary is unscoped for Admin', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture())

      await service.findCustomerById(user(), 'customer-1')

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { order: { customerId: 'customer-1' } } }),
      )
    })
  })

  describe('findCustomers', () => {
    it("scopes a Partner caller's list to customers with a shared Order", async () => {
      prisma.customer.findMany.mockResolvedValueOnce([])

      await service.findCustomers(user({ partnerId: 'partner-1' }), {})

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, orders: { some: { partnerId: 'partner-1' } } },
        }),
      )
    })

    it('applies status and free-text search filters', async () => {
      prisma.customer.findMany.mockResolvedValueOnce([])

      await service.findCustomers(user(), {
        filter: { status: CustomerStatus.SUSPENDED, search: 'acme' } as never,
      })

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            status: CustomerStatus.SUSPENDED,
            OR: [
              { displayName: { contains: 'acme', mode: 'insensitive' } },
              { billingEmail: { contains: 'acme', mode: 'insensitive' } },
            ],
          },
        }),
      )
    })

    it('sorts by displayName (with an id tiebreaker) when requested', async () => {
      prisma.customer.findMany.mockResolvedValueOnce([])

      await service.findCustomers(user(), {
        sort: { field: CustomerSortField.DISPLAY_NAME, direction: 'ASC' } as never,
      })

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ displayName: 'asc' }, { id: 'asc' }] }),
      )
    })

    it('defaults to sorting by createdAt (with an id tiebreaker) otherwise', async () => {
      prisma.customer.findMany.mockResolvedValueOnce([])

      await service.findCustomers(user(), {})

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
      )
    })

    it('computes hasNextPage from an extra fetched row', async () => {
      const rows = [customerFixture({ id: 'a' }), customerFixture({ id: 'b' })]
      prisma.customer.findMany.mockResolvedValueOnce(rows)

      const result = await service.findCustomers(user(), { first: 1 })

      expect(result.edges).toHaveLength(1)
      expect(result.pageInfo.hasNextPage).toBe(true)
      expect(result.edges[0]?.node.billingSummary).toBeNull()
    })
  })

  describe('createCustomer', () => {
    it('rejects a Partner-scoped caller (no ownership floor exists before any Order)', async () => {
      await expect(
        service.createCustomer(user({ partnerId: 'partner-1' }), {
          displayName: 'New Co',
          type: CustomerType.ORGANIZATION,
          billingEmail: 'yash.lakhani+newco@smartsensesolutions.com',
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('rejects a Customer-scoped caller', async () => {
      await expect(
        service.createCustomer(user({ customerId: 'customer-9' }), {
          displayName: 'New Co',
          type: CustomerType.ORGANIZATION,
          billingEmail: 'yash.lakhani+newco@smartsensesolutions.com',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates the customer and records an audit entry for an Admin caller', async () => {
      prisma.customer.create.mockResolvedValueOnce(customerFixture({ id: 'new-customer' }))
      prisma.customer.findFirst.mockResolvedValueOnce(customerFixture({ id: 'new-customer' }))

      await service.createCustomer(user(), {
        displayName: 'Acme Corp',
        type: CustomerType.ORGANIZATION,
        billingEmail: 'yash.lakhani+acme@smartsensesolutions.com',
      })

      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: {
          displayName: 'Acme Corp',
          type: CustomerType.ORGANIZATION,
          billingEmail: 'yash.lakhani+acme@smartsensesolutions.com',
        },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'CUSTOMER_CREATED', entityType: 'Customer' }),
      )
    })
  })

  describe('updateCustomer', () => {
    it("throws NOT_FOUND when the customer is out of the caller's scope", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.updateCustomer(user({ partnerId: 'partner-1' }), {
          id: 'customer-1',
          displayName: 'Renamed',
        }),
      ).rejects.toThrow(NotFoundException)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('updates only the provided fields and records an audit entry', async () => {
      prisma.customer.findFirst
        .mockResolvedValueOnce({
          id: 'customer-1',
          displayName: 'Acme Corp',
          status: CustomerStatus.ACTIVE,
        })
        .mockResolvedValueOnce(customerFixture({ displayName: 'Acme Corp Renamed' }))

      await service.updateCustomer(user(), { id: 'customer-1', displayName: 'Acme Corp Renamed' })

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { displayName: 'Acme Corp Renamed' },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'CUSTOMER_UPDATED', entityType: 'Customer' }),
      )
    })
  })

  describe('archiveCustomer', () => {
    it("throws NOT_FOUND when the customer is out of the caller's scope", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.archiveCustomer(user({ partnerId: 'partner-1' }), 'customer-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects archiving an already-suspended customer', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce({
        id: 'customer-1',
        displayName: 'Acme Corp',
        status: CustomerStatus.SUSPENDED,
      })

      await expect(service.archiveCustomer(user(), 'customer-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('suspends the customer and records an audit entry', async () => {
      prisma.customer.findFirst
        .mockResolvedValueOnce({
          id: 'customer-1',
          displayName: 'Acme Corp',
          status: CustomerStatus.ACTIVE,
        })
        .mockResolvedValueOnce(customerFixture({ status: CustomerStatus.SUSPENDED }))

      await service.archiveCustomer(user(), 'customer-1')

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { status: CustomerStatus.SUSPENDED },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'CUSTOMER_ARCHIVED', entityType: 'Customer' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.archived',
        expect.objectContaining({ customerId: 'customer-1', displayName: 'Acme Corp' }),
      )
    })
  })

  describe('activateCustomer', () => {
    it('rejects activating an already-active customer', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce({
        id: 'customer-1',
        displayName: 'Acme Corp',
        status: CustomerStatus.ACTIVE,
      })

      await expect(service.activateCustomer(user(), 'customer-1')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('reactivates a suspended customer and records an audit entry', async () => {
      prisma.customer.findFirst
        .mockResolvedValueOnce({
          id: 'customer-1',
          displayName: 'Acme Corp',
          status: CustomerStatus.SUSPENDED,
        })
        .mockResolvedValueOnce(customerFixture({ status: CustomerStatus.ACTIVE }))

      await service.activateCustomer(user(), 'customer-1')

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { status: CustomerStatus.ACTIVE },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'CUSTOMER_ACTIVATED', entityType: 'Customer' }),
      )
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.activated',
        expect.objectContaining({ customerId: 'customer-1', displayName: 'Acme Corp' }),
      )
    })
  })

  describe('getAuditLog', () => {
    it("throws NOT_FOUND when the customer is out of the caller's scope", async () => {
      prisma.customer.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.getAuditLog(user({ partnerId: 'partner-1' }), 'customer-1'),
      ).rejects.toThrow(NotFoundException)
      expect(auditLogService.findForEntity).not.toHaveBeenCalled()
    })

    it('maps entries, JSON-encoding metadata and flattening the actor', async () => {
      prisma.customer.findFirst.mockResolvedValueOnce({
        id: 'customer-1',
        displayName: 'Acme Corp',
        status: CustomerStatus.ACTIVE,
      })
      auditLogService.findForEntity.mockResolvedValueOnce([
        {
          id: 'log-1',
          action: 'CUSTOMER_ARCHIVED',
          entityType: 'Customer',
          entityId: 'customer-1',
          metadata: { displayName: 'Acme Corp' },
          occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          actor: {
            id: 'user-1',
            fullName: 'Test User',
            email: 'yash.lakhani+test@smartsensesolutions.com',
          },
        },
      ])

      const result = await service.getAuditLog(user(), 'customer-1')

      expect(auditLogService.findForEntity).toHaveBeenCalledWith('Customer', 'customer-1')
      expect(result).toEqual([
        expect.objectContaining({
          id: 'log-1',
          metadata: JSON.stringify({ displayName: 'Acme Corp' }),
          actorId: 'user-1',
          actorName: 'Test User',
          actorEmail: 'yash.lakhani+test@smartsensesolutions.com',
        }),
      ])
    })
  })

  describe('exportCustomersCsv', () => {
    it('scopes rows the same way findCustomers does (Partner floored to permitted customers)', async () => {
      prisma.customer.findMany.mockResolvedValueOnce([])

      await service.exportCustomersCsv(user({ partnerId: 'partner-1' }), {})

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, orders: { some: { partnerId: 'partner-1' } } },
        }),
      )
    })

    it('builds a CSV header + one row per customer', async () => {
      prisma.customer.findMany.mockResolvedValueOnce([
        {
          displayName: 'Acme Corp',
          type: CustomerType.ORGANIZATION,
          status: CustomerStatus.ACTIVE,
          billingEmail: 'yash.lakhani+acme@smartsensesolutions.com',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const csv = await service.exportCustomersCsv(user())

      const lines = csv.split('\n')
      expect(lines[0]).toBe('displayName,type,status,billingEmail,createdAt')
      expect(lines[1]).toBe(
        'Acme Corp,ORGANIZATION,ACTIVE,yash.lakhani+acme@smartsensesolutions.com,2026-01-01T00:00:00.000Z',
      )
    })
  })
})
