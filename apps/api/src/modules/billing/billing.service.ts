import { randomUUID } from 'crypto'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InvoiceStatus, type Payment, PaymentStatus, Prisma } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { type OrderCompletedEvent } from '../orders/events/order-completed.event'
import { CreatePaymentInput } from './dto/create-payment.input'
import { InvoiceConnectionOutput, InvoiceEdgeOutput } from './dto/invoice-connection.output'
import { InvoiceFilterInput } from './dto/invoice-filter.input'
import { InvoiceSortField } from './dto/invoice-sort.enum'
import { InvoiceSortInput } from './dto/invoice-sort.input'
import { InvoiceOutput } from './dto/invoice.output'
import { PaymentOutput } from './dto/payment.output'
import { generateInvoicePdf, type InvoiceForPdf } from './utils/invoice-pdf.generator'

const DEFAULT_PAGE_SIZE = 20

export const INVOICE_INCLUDE = { payments: true } satisfies Prisma.InvoiceInclude

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_INCLUDE }>

export interface FindInvoicesArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: InvoiceFilterInput | undefined
  sort?: InvoiceSortInput | undefined
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  getStatus(): string {
    return 'billing module initialized'
  }

  /**
   * Generates the per-Order Invoice that docs/domain-model.md § Billing Flow
   * triggers at Order Delivered→Completed. Called only by
   * BillingEventsListener — never exposed via GraphQL. `event` already
   * carries every field needed (orderId/orderNumber/partnerId/total), so
   * this never re-queries the Order. `event.changedByUserId` (the actor of
   * the triggering transition, per OrderCompletedEvent's own doc comment)
   * is the AuditLog actor — this codebase has no "system user" to fall back
   * to and AuditLog.actorUserId is a required FK.
   */
  async generateInvoiceForOrder(event: OrderCompletedEvent): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: this.generateInvoiceNumber(),
            orderId: event.orderId,
            partnerId: event.partnerId,
            amountDue: new Prisma.Decimal(event.total),
            status: InvoiceStatus.ISSUED,
            issuedAt: new Date(),
          },
        })
        await this.auditLogService.record(tx, {
          actorUserId: event.changedByUserId,
          action: 'invoice.generated',
          entityType: 'Invoice',
          entityId: invoice.id,
          metadata: {
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            amountDue: event.total,
          },
        })
        return invoice
      })
    } catch (error) {
      this.translatePrismaError(error, 'Invoice number collision, retry')
    }
  }

  async findInvoices(
    user: AuthenticatedUser,
    args: FindInvoicesArgs,
  ): Promise<InvoiceConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildWhere(user, args.filter)
    const orderBy = this.buildOrderBy(args.sort)

    const rows = await this.prisma.invoice.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: this.decodeCursor(after) },
        skip: 1,
      }),
      include: INVOICE_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: InvoiceEdgeOutput[] = page.map((invoice) => ({
      cursor: this.encodeCursor(invoice.id),
      node: this.mapInvoiceToOutput(invoice),
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

  async findInvoiceById(user: AuthenticatedUser, id: string): Promise<InvoiceOutput> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    })

    // Ownership miss reads as NOT_FOUND, never FORBIDDEN (docs/authorization.md
    // § Ownership Rules) — same pattern as OrdersService.findOrderById.
    // There is no Customer branch: Customers hold no billing:* permission at
    // all (docs/authorization.md's resource matrix), so this method is only
    // ever reached by Admin/Partner callers.
    if (invoice === null || (user.partnerId !== null && invoice.partnerId !== user.partnerId)) {
      throw new NotFoundException('Invoice not found')
    }

    return this.mapInvoiceToOutput(invoice)
  }

  /**
   * Voids an Invoice per docs/domain-model.md § Invoice: only DRAFT/ISSUED
   * can be voided, and only with zero recorded Payments. The payment count
   * and the status update happen in the same $transaction as the read that
   * decides them, so a Payment recorded concurrently can't race past this
   * check (docs/api-conventions.md § Transactions).
   */
  async voidInvoice(user: AuthenticatedUser, id: string): Promise<InvoiceOutput> {
    // Ownership-checked lookup first — never leak existence of an
    // out-of-scope Invoice (same reasoning as findInvoiceById).
    await this.findInvoiceById(user, id)

    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id } })
      if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
        throw new ConflictException(`Cannot void an Invoice in status ${invoice.status}`)
      }
      const paymentCount = await tx.payment.count({ where: { invoiceId: id } })
      if (paymentCount > 0) {
        throw new ConflictException('Cannot void an Invoice that has recorded Payments')
      }

      await tx.invoice.update({ where: { id }, data: { status: InvoiceStatus.VOID } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'invoice.voided',
        entityType: 'Invoice',
        entityId: id,
        metadata: { previousStatus: invoice.status },
      })
    })

    return this.findInvoiceById(user, id)
  }

  /**
   * Idempotency pattern per docs/api-conventions.md § Idempotency (this
   * mutation is that section's canonical example): a retry supplying the
   * same idempotencyKey returns the original Payment rather than creating a
   * duplicate. The existence check and the create happen in the same
   * $transaction so two near-simultaneous retries can't both pass the
   * "does it exist" check before either commits — the unique constraint on
   * `idempotencyKey` is the actual backstop.
   */
  async recordPayment(user: AuthenticatedUser, input: CreatePaymentInput): Promise<PaymentOutput> {
    const payment = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      })
      if (existing !== null) return existing

      const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } })
      if (invoice === null) throw new NotFoundException('Invoice not found')

      let created
      try {
        created = await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: new Prisma.Decimal(input.amount),
            method: input.method,
            externalTransactionId: input.externalTransactionId,
            idempotencyKey: input.idempotencyKey,
            // v1 has no live payment gateway (docs/roadmap.md) — a recorded
            // Payment is "recorded, not processed" and therefore already
            // succeeded; there is no PENDING/webhook-callback flow.
            status: PaymentStatus.SUCCEEDED,
            processedAt: new Date(),
          },
        })
      } catch (error) {
        this.translatePrismaError(
          error,
          'Payment collision (duplicate idempotency key or external transaction id), retry',
        )
      }

      const succeededPayments = await tx.payment.findMany({
        where: { invoiceId: invoice.id, status: PaymentStatus.SUCCEEDED },
      })
      const totalPaid = succeededPayments.reduce(
        (sum, candidate) => sum.plus(candidate.amount),
        new Prisma.Decimal(0),
      )

      let nextStatus: InvoiceStatus | undefined
      if (totalPaid.greaterThanOrEqualTo(invoice.amountDue)) nextStatus = InvoiceStatus.PAID
      else if (totalPaid.greaterThan(0)) nextStatus = InvoiceStatus.PARTIALLY_PAID

      if (nextStatus !== undefined) {
        await tx.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } })
      }

      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'payment.recorded',
        entityType: 'Payment',
        entityId: created.id,
        metadata: {
          invoiceId: invoice.id,
          amount: input.amount,
          method: input.method,
        },
      })

      return created
    })

    return this.mapPaymentToOutput(payment)
  }

  /** Same scoping as findInvoices, but fetches every matching row (no pagination). */
  async exportInvoicesCsv(
    user: AuthenticatedUser,
    filter?: InvoiceFilterInput | undefined,
  ): Promise<string> {
    const where = this.buildWhere(user, filter)
    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: this.buildOrderBy(undefined),
    })

    const header = [
      'invoiceNumber',
      'orderId',
      'partnerId',
      'amountDue',
      'status',
      'issuedAt',
      'dueAt',
    ]
    const rows = invoices.map((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.orderId,
        invoice.partnerId,
        invoice.amountDue.toString(),
        invoice.status,
        invoice.issuedAt?.toISOString() ?? '',
        invoice.dueAt?.toISOString() ?? '',
      ]
        .map((field) => this.escapeCsvField(field))
        .join(','),
    )

    return [header.join(','), ...rows].join('\n')
  }

  async getInvoicePdf(user: AuthenticatedUser, id: string): Promise<string> {
    // Ownership-checked lookup first (throws NOT_FOUND on a missing or
    // out-of-scope id) — the re-fetch below is then safe to run unscoped.
    await this.findInvoiceById(user, id)

    const invoice: InvoiceForPdf = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: { payments: true, order: { include: { items: true } } },
    })

    const buffer = await generateInvoicePdf(invoice)
    return buffer.toString('base64')
  }

  private generateInvoiceNumber(): string {
    return `INV-${randomUUID().split('-')[0]?.toUpperCase()}`
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private translatePrismaError(error: unknown, conflictMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException(conflictMessage)
      if (error.code === 'P2003') {
        throw new NotFoundException('Referenced record does not exist')
      }
    }
    throw error
  }

  /**
   * Ownership derives from the caller's own provisioned organization
   * (docs/authorization.md § Ownership Rules): a Partner-scoped caller is
   * always floored to their own partnerId, Admin (partnerId null) sees
   * everything. There is no Customer case — Customers hold no billing:*
   * permission, enforced at the resolver, so this is never reached for one.
   */
  private buildWhere(
    user: AuthenticatedUser,
    filter: InvoiceFilterInput | undefined,
  ): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {}

    // filter fields are `nullable: true` in the GraphQL schema, so a
    // well-formed client can legitimately send `null` rather than omitting
    // the key — normalize both to "not provided" once, here (same
    // defensive normalization OrdersService.buildWhere applies).
    const partnerId = filter?.partnerId ?? undefined
    const status = filter?.status ?? undefined

    if (user.partnerId !== null) {
      where.partnerId = user.partnerId
    } else if (partnerId !== undefined) {
      where.partnerId = partnerId
    }

    if (status !== undefined) where.status = status

    return where
  }

  // `id` breaks ties: two rows sharing the exact same amountDue/createdAt
  // could otherwise skip or repeat across cursor-paginated pages, since
  // Prisma's cursor pagination requires orderBy to fully determine a total
  // order.
  private buildOrderBy(
    sort: InvoiceSortInput | undefined,
  ): Prisma.InvoiceOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === InvoiceSortField.ISSUED_AT) return [{ issuedAt: direction }, { id: 'asc' }]
    if (sort?.field === InvoiceSortField.DUE_AT) return [{ dueAt: direction }, { id: 'asc' }]
    if (sort?.field === InvoiceSortField.AMOUNT_DUE) {
      return [{ amountDue: direction }, { id: 'asc' }]
    }
    return [{ createdAt: direction }, { id: 'asc' }]
  }

  mapInvoiceToOutput(invoice: InvoiceWithRelations): InvoiceOutput {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      partnerId: invoice.partnerId,
      amountDue: invoice.amountDue,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      payments: invoice.payments.map((payment) => this.mapPaymentToOutput(payment)),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  }

  mapPaymentToOutput(payment: Payment): PaymentOutput {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      method: payment.method,
      externalTransactionId: payment.externalTransactionId,
      status: payment.status,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
    }
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id, 'utf8').toString('base64')
  }

  private decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf8')
  }
}
