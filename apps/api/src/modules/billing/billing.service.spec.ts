import { ConflictException, NotFoundException } from '@nestjs/common'
import { InvoiceStatus, PaymentMethod, PaymentStatus, Prisma, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { OrderCompletedEvent } from '../orders/events/order-completed.event'
import { BillingService } from './billing.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: ['billing:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function invoiceFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invoice-1',
    invoiceNumber: 'INV-0001',
    orderId: 'order-1',
    partnerId: 'partner-1',
    amountDue: new Prisma.Decimal(100),
    status: InvoiceStatus.ISSUED,
    issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    dueAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    payments: [],
    ...overrides,
  }
}

function paymentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    amount: new Prisma.Decimal(50),
    method: PaymentMethod.CARD,
    externalTransactionId: 'ext-1',
    idempotencyKey: 'idem-1',
    status: PaymentStatus.SUCCEEDED,
    processedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('BillingService', () => {
  let service: BillingService
  let prisma: {
    invoice: {
      findMany: jest.Mock
      findUnique: jest.Mock
      findUniqueOrThrow: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    payment: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; count: jest.Mock }
    $transaction: jest.Mock
  }
  let auditLogService: { record: jest.Mock }
  let eventEmitter: { emit: jest.Mock }

  beforeEach(() => {
    prisma = {
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      payment: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    auditLogService = { record: jest.fn() }
    eventEmitter = { emit: jest.fn() }
    service = new BillingService(prisma as never, auditLogService as never, eventEmitter as never)
  })

  describe('generateInvoiceForOrder', () => {
    it('creates an Invoice with the amountDue/partnerId from the event and writes an audit log', async () => {
      prisma.invoice.create.mockResolvedValueOnce(
        invoiceFixture({
          id: 'invoice-9',
          partnerId: 'partner-9',
          amountDue: new Prisma.Decimal(250),
        }),
      )

      const event = new OrderCompletedEvent('order-9', 'ORD-0009', 'partner-9', '250', 'user-9')
      await service.generateInvoiceForOrder(event)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-9',
            partnerId: 'partner-9',
            amountDue: expect.objectContaining({ toString: expect.any(Function) }) as unknown,
            status: InvoiceStatus.ISSUED,
          }),
        }),
      )
      const createCall = prisma.invoice.create.mock.calls[0]?.[0]
      expect(createCall.data.amountDue.toString()).toBe('250')

      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          actorUserId: 'user-9',
          action: 'invoice.generated',
          entityType: 'Invoice',
          entityId: 'invoice-9',
        }),
      )
    })

    it('emits InvoiceGeneratedEvent after the transaction commits', async () => {
      prisma.invoice.create.mockResolvedValueOnce(
        invoiceFixture({
          id: 'invoice-9',
          invoiceNumber: 'INV-0009',
          partnerId: 'partner-9',
          amountDue: new Prisma.Decimal(250),
        }),
      )

      const event = new OrderCompletedEvent('order-9', 'ORD-0009', 'partner-9', '250', 'user-9')
      await service.generateInvoiceForOrder(event)

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invoice.generated',
        expect.objectContaining({
          invoiceId: 'invoice-9',
          invoiceNumber: 'INV-0009',
          orderId: 'order-9',
          orderNumber: 'ORD-0009',
          partnerId: 'partner-9',
          amountDue: '250',
        }),
      )
    })

    it('translates an invoiceNumber collision (P2002) to a retry-worthy ConflictException', async () => {
      prisma.invoice.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('collision', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      )

      const event = new OrderCompletedEvent('order-1', 'ORD-0001', 'partner-1', '100', 'user-1')
      await expect(service.generateInvoiceForOrder(event)).rejects.toThrow(ConflictException)
    })
  })

  describe('findInvoiceById', () => {
    it("throws NOT_FOUND (not FORBIDDEN) when a Partner requests another Partner's invoice", async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ partnerId: 'other-partner' }),
      )

      await expect(
        service.findInvoiceById(user({ partnerId: 'partner-1' }), 'invoice-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws NOT_FOUND when the invoice does not exist', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(null)

      await expect(service.findInvoiceById(user(), 'invoice-1')).rejects.toThrow(NotFoundException)
    })

    it('returns the mapped invoice for its own Partner', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(invoiceFixture())

      const result = await service.findInvoiceById(user({ partnerId: 'partner-1' }), 'invoice-1')

      expect(result.id).toBe('invoice-1')
    })
  })

  describe('voidInvoice', () => {
    it('succeeds on a payment-free ISSUED invoice', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce(invoiceFixture({ status: InvoiceStatus.ISSUED }))
        .mockResolvedValueOnce(invoiceFixture({ status: InvoiceStatus.VOID }))
      prisma.invoice.findUniqueOrThrow.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.ISSUED }),
      )
      prisma.payment.count.mockResolvedValueOnce(0)

      await service.voidInvoice(user({ partnerId: 'partner-1' }), 'invoice-1')

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { status: InvoiceStatus.VOID },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ action: 'invoice.voided', entityId: 'invoice-1' }),
      )
    })

    it('throws ConflictException when the invoice already has a payment', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.ISSUED }),
      )
      prisma.invoice.findUniqueOrThrow.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.ISSUED }),
      )
      prisma.payment.count.mockResolvedValueOnce(1)

      await expect(
        service.voidInvoice(user({ partnerId: 'partner-1' }), 'invoice-1'),
      ).rejects.toThrow(ConflictException)
      expect(prisma.invoice.update).not.toHaveBeenCalled()
    })

    it('throws ConflictException when the invoice is already PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.PAID }),
      )
      prisma.invoice.findUniqueOrThrow.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.PAID }),
      )

      await expect(
        service.voidInvoice(user({ partnerId: 'partner-1' }), 'invoice-1'),
      ).rejects.toThrow(ConflictException)
      expect(prisma.payment.count).not.toHaveBeenCalled()
      expect(prisma.invoice.update).not.toHaveBeenCalled()
    })

    it('throws ConflictException when the invoice is already VOID', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.VOID }),
      )
      prisma.invoice.findUniqueOrThrow.mockResolvedValueOnce(
        invoiceFixture({ status: InvoiceStatus.VOID }),
      )

      await expect(
        service.voidInvoice(user({ partnerId: 'partner-1' }), 'invoice-1'),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('recordPayment', () => {
    const input = {
      invoiceId: 'invoice-1',
      amount: '50',
      method: PaymentMethod.CARD,
      externalTransactionId: 'ext-1',
      idempotencyKey: 'idem-1',
    }

    it('creates exactly one Payment row and returns the same result for a repeated idempotencyKey', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ amountDue: new Prisma.Decimal(100) }),
      )
      prisma.payment.create.mockResolvedValueOnce(paymentFixture())
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(50) }),
      ])

      const first = await service.recordPayment(user({ partnerId: null }), input)

      // Second call: the idempotency key now resolves to the existing row.
      prisma.payment.findUnique.mockResolvedValueOnce(paymentFixture())

      const second = await service.recordPayment(user({ partnerId: null }), input)

      expect(prisma.payment.create).toHaveBeenCalledTimes(1)
      expect(first).toEqual(second)
    })

    it('emits PaymentRecordedEvent for a freshly created payment', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({
          id: 'invoice-1',
          invoiceNumber: 'INV-0001',
          partnerId: 'partner-1',
          amountDue: new Prisma.Decimal(100),
        }),
      )
      prisma.payment.create.mockResolvedValueOnce(paymentFixture({ id: 'payment-9' }))
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(50) }),
      ])

      await service.recordPayment(user(), input)

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'payment.recorded',
        expect.objectContaining({
          paymentId: 'payment-9',
          invoiceId: 'invoice-1',
          invoiceNumber: 'INV-0001',
          partnerId: 'partner-1',
          amount: '50',
        }),
      )
    })

    it('does not re-emit PaymentRecordedEvent on an idempotent replay', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(paymentFixture())

      await service.recordPayment(user(), input)

      expect(eventEmitter.emit).not.toHaveBeenCalledWith('payment.recorded', expect.anything())
      expect(prisma.payment.create).not.toHaveBeenCalled()
    })

    it('transitions Invoice.status to PARTIALLY_PAID when the payment is less than amountDue', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ amountDue: new Prisma.Decimal(100) }),
      )
      prisma.payment.create.mockResolvedValueOnce(
        paymentFixture({ amount: new Prisma.Decimal(40) }),
      )
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(40) }),
      ])

      await service.recordPayment(user(), { ...input, amount: '40' })

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { status: InvoiceStatus.PARTIALLY_PAID },
      })
    })

    it('transitions Invoice.status to PAID when payments sum to exactly amountDue', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ amountDue: new Prisma.Decimal(100) }),
      )
      prisma.payment.create.mockResolvedValueOnce(
        paymentFixture({ amount: new Prisma.Decimal(100) }),
      )
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(100) }),
      ])

      await service.recordPayment(user(), { ...input, amount: '100' })

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { status: InvoiceStatus.PAID },
      })
    })

    it('throws NOT_FOUND when the invoice does not exist', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(null)

      await expect(service.recordPayment(user(), input)).rejects.toThrow(NotFoundException)
      expect(prisma.payment.create).not.toHaveBeenCalled()
    })

    it("throws NOT_FOUND (not FORBIDDEN) when a Partner records a payment against another Partner's invoice", async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ partnerId: 'other-partner' }),
      )

      await expect(service.recordPayment(user({ partnerId: 'partner-1' }), input)).rejects.toThrow(
        NotFoundException,
      )
      expect(prisma.payment.create).not.toHaveBeenCalled()
    })

    it('lets the owning Partner record a payment against their own invoice', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ partnerId: 'partner-1', amountDue: new Prisma.Decimal(100) }),
      )
      prisma.payment.create.mockResolvedValueOnce(paymentFixture())
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(50) }),
      ])

      const result = await service.recordPayment(user({ partnerId: 'partner-1' }), input)

      expect(result.id).toBe('payment-1')
      expect(prisma.payment.create).toHaveBeenCalledTimes(1)
    })

    it("lets an Admin record a payment against any Partner's invoice", async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(
        invoiceFixture({ partnerId: 'any-partner', amountDue: new Prisma.Decimal(100) }),
      )
      prisma.payment.create.mockResolvedValueOnce(paymentFixture())
      prisma.payment.findMany.mockResolvedValueOnce([
        paymentFixture({ amount: new Prisma.Decimal(50) }),
      ])

      const result = await service.recordPayment(user({ partnerId: null }), input)

      expect(result.id).toBe('payment-1')
      expect(prisma.payment.create).toHaveBeenCalledTimes(1)
    })

    it('translates an externalTransactionId collision (P2002) to a ConflictException', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null)
      prisma.invoice.findUnique.mockResolvedValueOnce(invoiceFixture())
      prisma.payment.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('collision', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      )

      await expect(service.recordPayment(user(), input)).rejects.toThrow(ConflictException)
    })
  })
})
