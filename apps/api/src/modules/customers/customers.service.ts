import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CustomerStatus, InvoiceStatus, Prisma, PaymentStatus } from '@prisma/client'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { buildCsv } from '../../common/utils/csv.util'
import { AuditLogEntryOutput } from './dto/audit-log-entry.output'
import { CustomerBillingSummaryOutput } from './dto/customer-billing-summary.output'
import { CustomerConnectionOutput, CustomerEdgeOutput } from './dto/customer-connection.output'
import { CustomerFilterInput } from './dto/customer-filter.input'
import { CustomerSortField } from './dto/customer-sort.enum'
import { CustomerSortInput } from './dto/customer-sort.input'
import { CustomerOutput } from './dto/customer.output'
import { CreateCustomerInput } from './dto/create-customer.input'
import { UpdateCustomerInput } from './dto/update-customer.input'
import { CustomerActivatedEvent } from './events/customer-activated.event'
import { CustomerArchivedEvent } from './events/customer-archived.event'

const DEFAULT_PAGE_SIZE = 20

const CUSTOMER_INCLUDE = {
  addresses: {
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  },
  users: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CustomerInclude

type CustomerWithRelations = Prisma.CustomerGetPayload<{ include: typeof CUSTOMER_INCLUDE }>

export interface FindCustomersArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: CustomerFilterInput | undefined
  sort?: CustomerSortInput | undefined
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getStatus(): string {
    return 'customers module initialized'
  }

  async findCustomers(
    user: AuthenticatedUser,
    args: FindCustomersArgs,
  ): Promise<CustomerConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildWhere(user, args.filter)
    const orderBy = this.buildOrderBy(args.sort)

    const rows = await this.prisma.customer.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: this.decodeCursor(after) },
        skip: 1,
      }),
      include: CUSTOMER_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: CustomerEdgeOutput[] = page.map((customer) => ({
      cursor: this.encodeCursor(customer.id),
      // billingSummary is intentionally null on every list row — see
      // CustomerBillingSummaryOutput's description.
      node: this.mapCustomerToOutput(customer),
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

  async findCustomerById(user: AuthenticatedUser, id: string): Promise<CustomerOutput> {
    const customer = await this.prisma.customer.findFirst({
      where: this.scopeToId(user, id),
      include: CUSTOMER_INCLUDE,
    })
    // Ownership miss reads as NOT_FOUND, never FORBIDDEN (docs/authorization.md
    // § Ownership Rules) — same pattern as OrdersService.findOrderById.
    if (customer === null) {
      throw new NotFoundException('Customer not found')
    }

    const billingSummary = await this.computeBillingSummary(user, id)
    return this.mapCustomerToOutput(customer, billingSummary)
  }

  /**
   * Admin-only. Unlike update/archive/activate, a brand-new Customer has no
   * Order yet linking it to any Partner, so there is no "permitted customer"
   * floor (buildWhere's `orders.some`) a Partner could satisfy — creation is
   * necessarily unscoped, and therefore restricted to Admin rather than
   * opened to every Partner (docs/authorization.md § Ownership Rules).
   */
  async createCustomer(
    user: AuthenticatedUser,
    input: CreateCustomerInput,
  ): Promise<CustomerOutput> {
    if (user.partnerId !== null || user.customerId !== null) {
      throw new BadRequestException('Only an Admin-scoped user can create a Customer')
    }

    let created
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: {
            displayName: input.displayName,
            type: input.type,
            billingEmail: input.billingEmail,
          },
        })
        await this.auditLogService.record(tx, {
          actorUserId: user.id,
          action: 'CUSTOMER_CREATED',
          entityType: 'Customer',
          entityId: customer.id,
          metadata: { displayName: customer.displayName },
        })
        return customer
      })
    } catch (error) {
      this.translatePrismaError(error)
    }

    return this.findCustomerById(user, created.id)
  }

  /** Partial update. Ownership is verified before any write (docs/authorization.md § Ownership Rules). */
  async updateCustomer(
    user: AuthenticatedUser,
    input: UpdateCustomerInput,
  ): Promise<CustomerOutput> {
    await this.findOwnedCustomerOrThrow(user, input.id)

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id: input.id },
          data: {
            ...(input.displayName !== undefined && { displayName: input.displayName }),
            ...(input.type !== undefined && { type: input.type }),
            ...(input.billingEmail !== undefined && { billingEmail: input.billingEmail }),
          },
        })
        await this.auditLogService.record(tx, {
          actorUserId: user.id,
          action: 'CUSTOMER_UPDATED',
          entityType: 'Customer',
          entityId: input.id,
          metadata: {
            ...(input.displayName !== undefined && { displayName: input.displayName }),
            ...(input.type !== undefined && { type: input.type }),
            ...(input.billingEmail !== undefined && { billingEmail: input.billingEmail }),
          },
        })
      })
    } catch (error) {
      this.translatePrismaError(error)
    }

    return this.findCustomerById(user, input.id)
  }

  /**
   * "Soft archive" per the product requirement — a status transition to
   * SUSPENDED (visibility/capability only, per docs/domain-model.md § Customer
   * Lifecycle: "cannot place new Orders but can still view Order history"),
   * never a row/soft-delete. Customers are never hard-deleted (same doc).
   */
  async archiveCustomer(user: AuthenticatedUser, id: string): Promise<CustomerOutput> {
    const existing = await this.findOwnedCustomerOrThrow(user, id)
    if (existing.status === CustomerStatus.SUSPENDED) {
      throw new BadRequestException('Customer is already suspended')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { status: CustomerStatus.SUSPENDED } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'CUSTOMER_ARCHIVED',
        entityType: 'Customer',
        entityId: id,
        metadata: { displayName: existing.displayName },
      })
    })

    // Emitted only once the transaction has committed — NotificationEventsListener
    // fans this out to the Customer's own assigned Users (SM-328), and must
    // never see a suspension that then rolled back.
    this.eventEmitter.emit(
      CustomerArchivedEvent.EVENT_NAME,
      new CustomerArchivedEvent(id, existing.displayName),
    )

    return this.findCustomerById(user, id)
  }

  /** Reverses archiveCustomer — the lifecycle is bidirectional (docs/domain-model.md § Customer Lifecycle: Active ⇄ Suspended). */
  async activateCustomer(user: AuthenticatedUser, id: string): Promise<CustomerOutput> {
    const existing = await this.findOwnedCustomerOrThrow(user, id)
    if (existing.status === CustomerStatus.ACTIVE) {
      throw new BadRequestException('Customer is already active')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { status: CustomerStatus.ACTIVE } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'CUSTOMER_ACTIVATED',
        entityType: 'Customer',
        entityId: id,
        metadata: { displayName: existing.displayName },
      })
    })

    this.eventEmitter.emit(
      CustomerActivatedEvent.EVENT_NAME,
      new CustomerActivatedEvent(id, existing.displayName),
    )

    return this.findCustomerById(user, id)
  }

  /** Backs the Customer detail page's Activity Timeline tab. */
  async getAuditLog(user: AuthenticatedUser, customerId: string): Promise<AuditLogEntryOutput[]> {
    await this.findOwnedCustomerOrThrow(user, customerId)

    const entries = await this.auditLogService.findForEntity('Customer', customerId)
    return entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata !== null ? JSON.stringify(entry.metadata) : null,
      occurredAt: entry.occurredAt,
      actorId: entry.actor.id,
      actorName: entry.actor.fullName,
      actorEmail: entry.actor.email,
    }))
  }

  /** Same scoping as findCustomers, but fetches every matching row (no pagination). */
  async exportCustomersCsv(
    user: AuthenticatedUser,
    filter?: CustomerFilterInput | undefined,
  ): Promise<string> {
    const where = this.buildWhere(user, filter)
    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: this.buildOrderBy(undefined),
    })

    const header = ['displayName', 'type', 'status', 'billingEmail', 'createdAt']
    const rows = customers.map((customer) => [
      customer.displayName,
      customer.type,
      customer.status,
      customer.billingEmail,
      customer.createdAt.toISOString(),
    ])

    return buildCsv(header, rows)
  }

  private async findOwnedCustomerOrThrow(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ id: string; displayName: string; status: CustomerStatus }> {
    const customer = await this.prisma.customer.findFirst({
      where: this.scopeToId(user, id),
      select: { id: true, displayName: true, status: true },
    })
    if (customer === null) {
      throw new NotFoundException('Customer not found')
    }
    return customer
  }

  private scopeToId(user: AuthenticatedUser, id: string): Prisma.CustomerWhereInput {
    return {
      id,
      deletedAt: null,
      ...(user.partnerId !== null && { orders: { some: { partnerId: user.partnerId } } }),
    }
  }

  /**
   * Scoped by both Customer and (for a Partner caller) their own Order
   * relationship — an Invoice's `partnerId` is the vendor side of a single
   * Order, so without this a Partner viewing a shared Customer would see
   * every OTHER Partner's billing relationship with that Customer too
   * (docs/authorization.md § Ownership Rules: "Invoices... only their own").
   */
  private async computeBillingSummary(
    user: AuthenticatedUser,
    customerId: string,
  ): Promise<CustomerBillingSummaryOutput> {
    const orderWhere: Prisma.OrderWhereInput = {
      customerId,
      ...(user.partnerId !== null && { partnerId: user.partnerId }),
    }

    const [totalOrders, invoices] = await Promise.all([
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.invoice.findMany({
        where: { order: orderWhere },
        select: {
          amountDue: true,
          status: true,
          payments: { where: { status: PaymentStatus.SUCCEEDED }, select: { amount: true } },
        },
      }),
    ])

    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum.plus(invoice.amountDue),
      new Prisma.Decimal(0),
    )
    // Nets SUCCEEDED Payments against amountDue — a PARTIALLY_PAID invoice's
    // full amountDue otherwise overstates what's actually still owed
    // (docs/database-schema.md § Constraints Not Enforceable: sum(Succeeded
    // Payments) tracks toward amountDue, it isn't automatically netted).
    // Clamped at zero as a defensive floor, not an expected case.
    const totalOutstanding = invoices
      .filter(
        (invoice) =>
          invoice.status === InvoiceStatus.ISSUED ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID,
      )
      .reduce((sum, invoice) => {
        const paid = invoice.payments.reduce(
          (paidSum, payment) => paidSum.plus(payment.amount),
          new Prisma.Decimal(0),
        )
        const remaining = invoice.amountDue.minus(paid)
        return sum.plus(remaining.isNegative() ? new Prisma.Decimal(0) : remaining)
      }, new Prisma.Decimal(0))

    return { totalOrders, totalInvoiced, totalOutstanding }
  }

  private translatePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A customer with this billing email already exists')
      }
    }
    throw error
  }

  /**
   * Ownership derives from the caller's own provisioned organization
   * (docs/authorization.md § Ownership Rules). `Customer` has no `partnerId`
   * FK — a Partner's "permitted" customers are derived through Order: any
   * Customer with at least one Order placed with this Partner as vendor.
   * Admin (no partnerId) is unrestricted. The Customer role never reaches
   * this service — `customers:read`/`customers:write` are not granted to it
   * (this is an Admin/Partner management surface, not buyer self-service).
   */
  private buildWhere(
    user: AuthenticatedUser,
    filter: CustomerFilterInput | undefined,
  ): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = { deletedAt: null }
    const status = filter?.status ?? undefined
    const search = filter?.search ?? undefined

    if (user.partnerId !== null) {
      where.orders = { some: { partnerId: user.partnerId } }
    }

    if (status !== undefined) where.status = status
    if (search !== undefined && search.trim() !== '') {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    return where
  }

  // `id` breaks ties: two rows sharing the exact same displayName/createdAt
  // could otherwise skip or repeat across cursor-paginated pages, since
  // Prisma's cursor pagination requires orderBy to fully determine a total
  // order.
  private buildOrderBy(
    sort: CustomerSortInput | undefined,
  ): Prisma.CustomerOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === CustomerSortField.DISPLAY_NAME) {
      return [{ displayName: direction }, { id: 'asc' }]
    }
    return [{ createdAt: direction }, { id: 'asc' }]
  }

  private mapCustomerToOutput(
    customer: CustomerWithRelations,
    billingSummary: CustomerBillingSummaryOutput | null = null,
  ): CustomerOutput {
    return {
      id: customer.id,
      displayName: customer.displayName,
      type: customer.type,
      status: customer.status,
      billingEmail: customer.billingEmail,
      addresses: customer.addresses.map((address) => ({
        id: address.id,
        type: address.type,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      })),
      assignedUsers: customer.users.map((assignedUser) => ({
        id: assignedUser.id,
        email: assignedUser.email,
        fullName: assignedUser.fullName,
        status: assignedUser.status,
      })),
      billingSummary,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id, 'utf8').toString('base64')
  }

  private decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf8')
  }
}
