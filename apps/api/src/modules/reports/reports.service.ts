import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  type BillingReport,
  BillingReportStatus,
  InvoiceStatus,
  type NotificationType,
  NotificationStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { type DateRangeInput } from '../../common/graphql/date-range.input'
import { AuditLogService } from '../../common/services/audit-log.service'
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.util'
import { buildCsv } from '../../common/utils/csv.util'
import {
  BillingReportConnectionOutput,
  BillingReportEdgeOutput,
} from './dto/billing-report-connection.output'
import { BillingReportFilterInput } from './dto/billing-report-filter.input'
import { BillingReportSortField } from './dto/billing-report-sort.enum'
import { BillingReportSortInput } from './dto/billing-report-sort.input'
import { BillingReportOutput } from './dto/billing-report.output'
import { CustomersReportFilterInput } from './dto/customers-report-filter.input'
import { CustomersReportOutput } from './dto/customers-report.output'
import { ExportReportInput } from './dto/export-report.input'
import { GenerateBillingReportInput } from './dto/generate-billing-report.input'
import {
  InventoryReportItemConnectionOutput,
  InventoryReportItemEdgeOutput,
} from './dto/inventory-report-item-connection.output'
import { InventoryReportFilterInput } from './dto/inventory-report-filter.input'
import { InventoryReportOutput } from './dto/inventory-report.output'
import { NotificationActivityReportFilterInput } from './dto/notification-activity-report-filter.input'
import { NotificationActivityReportOutput } from './dto/notification-activity-report.output'
import { OrdersReportFilterInput } from './dto/orders-report-filter.input'
import { OrdersReportOutput } from './dto/orders-report.output'
import {
  ProductPerformanceConnectionOutput,
  ProductPerformanceEdgeOutput,
} from './dto/product-performance-connection.output'
import { ProductPerformanceFilterInput } from './dto/product-performance-filter.input'
import { ProductPerformanceSortField } from './dto/product-performance-sort.enum'
import { ProductPerformanceSortInput } from './dto/product-performance-sort.input'
import { ReportExportFormat } from './dto/report-export-format.enum'
import { ReportExportType } from './dto/report-export-type.enum'
import { RevenueBucketGranularity } from './dto/revenue-bucket-granularity.enum'
import { RevenueReportFilterInput } from './dto/revenue-report-filter.input'
import { RevenueReportBucketOutput, RevenueReportOutput } from './dto/revenue-report.output'
import { ReportsDashboardFilterInput } from './dto/reports-dashboard-filter.input'
import { ReportsDashboardOutput } from './dto/reports-dashboard.output'

const DEFAULT_PAGE_SIZE = 20

// Safety net for the low-stock query only. Its `quantityOnHand <
// reorderThreshold` predicate is a cross-column comparison Prisma cannot
// express in a `where` clause (see fetchLowStockRows' $queryRaw), so without a
// LIMIT even a Partner-scoped call would stream that Partner's entire
// inventory into Node memory before filtering. 500 is far above any realistic
// count of simultaneously-low SKUs for a single report view, yet hard-bounds
// the worst case (F-C2). Also caps lowStockCount — an intentional tradeoff, a
// "500+" signal is as actionable as an exact four-digit count.
const MAX_LOW_STOCK_ROWS = 500

// Hard row cap for the synchronous, in-memory CSV exports (F-H4). An export
// that would exceed this is rejected with an explicit "narrow your filter"
// error rather than silently truncated — v1 deliberately has no streamed or
// queued export mechanism. 10k rows is a comfortable ceiling for building a
// CSV string in memory in one request while still stopping an Admin-unscoped
// full-table pull from becoming an OOM/latency event.
const CSV_EXPORT_MAX_ROWS = 10_000

// Flat row shape returned by the low-stock $queryRaw. Postgres `int4` columns
// (quantity*/reorderThreshold) come back as JS numbers; the WHERE clause
// guarantees reorderThreshold is non-null.
interface LowStockRow {
  productVariantId: string
  sku: string
  productTitle: string
  partnerId: string
  quantityOnHand: number
  quantityReserved: number
  reorderThreshold: number
}

// Invoice statuses counted toward "revenue" everywhere in this module —
// same set the plan's BillingReport aggregation formula uses, reused for
// RevenueReport/ReportsDashboard so the two never silently diverge.
const REVENUE_ELIGIBLE_INVOICE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.ISSUED,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.PAID,
]

export interface FindBillingReportsArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: BillingReportFilterInput | undefined
  sort?: BillingReportSortInput | undefined
}

export interface GetInventoryReportArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: InventoryReportFilterInput | undefined
}

export interface GetProductPerformanceReportArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: ProductPerformanceFilterInput | undefined
  sort?: ProductPerformanceSortInput | undefined
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ---------------------------------------------------------------------
  // Billing Reports — the only persisted, write-bearing part of this module
  // ---------------------------------------------------------------------

  async findBillingReports(
    user: AuthenticatedUser,
    args: FindBillingReportsArgs,
  ): Promise<BillingReportConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildBillingReportWhere(user, args.filter)
    const orderBy = this.buildBillingReportOrderBy(args.sort)

    const rows = await this.prisma.billingReport.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: decodeCursor(after) },
        skip: 1,
      }),
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: BillingReportEdgeOutput[] = page.map((report) => ({
      cursor: encodeCursor(report.id),
      node: this.mapBillingReportToOutput(report),
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

  async findBillingReportById(user: AuthenticatedUser, id: string): Promise<BillingReportOutput> {
    return this.mapBillingReportToOutput(await this.findBillingReportRow(user, id))
  }

  /**
   * Computes and persists a BillingReport for a single Partner/period
   * (docs/domain-model.md § Billing Report). Aggregation formula:
   *   grossRevenue     = SUM(Invoice.amountDue) WHERE partnerId=<scoped>
   *                        AND status IN (ISSUED, PARTIALLY_PAID, PAID)
   *                        AND issuedAt BETWEEN periodStart AND periodEnd
   *   commissionAmount = grossRevenue * (Partner.commissionRate / 100)
   *   netPayout        = grossRevenue - commissionAmount
   * `commissionRate` is a 0-100 percentage (schema.prisma:257-260), never a
   * 0-1 fraction — dividing by 100 is required, not optional. A zero-revenue
   * period (no matching Invoices) is a legitimate, generatable report, not
   * an error: `_sum.amountDue` comes back `null` for zero matching rows and
   * is coalesced to `Decimal(0)` rather than rejected.
   *
   * The exact-duplicate-period case is rejected by the `@@unique` (P2002);
   * any overlapping-but-not-identical period is rejected by the Postgres
   * GiST exclusion constraint `billing_reports_no_overlapping_periods_excl`
   * (already live — see schema.prisma's BillingReport comment), which
   * Prisma does not map to a known error code. Both translate to a clean
   * ConflictException via translateBillingReportError, verified against the
   * real Postgres error shape in reports.e2e-spec.ts.
   */
  async generateBillingReport(
    user: AuthenticatedUser,
    input: GenerateBillingReportInput,
  ): Promise<BillingReportOutput> {
    const partnerId = this.resolveRequiredPartnerScope(user, input.partnerId)

    if (input.periodStart.getTime() >= input.periodEnd.getTime()) {
      throw new BadRequestException('periodStart must be before periodEnd')
    }

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } })
    if (partner === null) throw new NotFoundException('Partner not found')

    const revenueAgg = await this.prisma.invoice.aggregate({
      where: {
        partnerId,
        status: { in: REVENUE_ELIGIBLE_INVOICE_STATUSES },
        issuedAt: { gte: input.periodStart, lte: input.periodEnd },
      },
      _sum: { amountDue: true },
    })
    const grossRevenue = revenueAgg._sum.amountDue ?? new Prisma.Decimal(0)
    const commissionAmount = grossRevenue.times(partner.commissionRate).dividedBy(100)
    const netPayout = grossRevenue.minus(commissionAmount)

    let created: BillingReport
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const report = await tx.billingReport.create({
          data: {
            partnerId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            grossRevenue,
            commissionAmount,
            netPayout,
            status: BillingReportStatus.GENERATED,
          },
        })
        await this.auditLogService.record(tx, {
          actorUserId: user.id,
          action: 'billing_report.generated',
          entityType: 'BillingReport',
          entityId: report.id,
          metadata: {
            partnerId,
            periodStart: input.periodStart.toISOString(),
            periodEnd: input.periodEnd.toISOString(),
            grossRevenue: grossRevenue.toString(),
          },
        })
        return report
      })
    } catch (error) {
      this.translateBillingReportError(error)
    }

    return this.mapBillingReportToOutput(created)
  }

  /** GENERATED → FINALIZED (docs/domain-model.md § Billing Report lifecycle). */
  async finalizeBillingReport(user: AuthenticatedUser, id: string): Promise<BillingReportOutput> {
    const report = await this.findBillingReportRow(user, id)
    if (report.status !== BillingReportStatus.GENERATED) {
      throw new ConflictException(`Cannot finalize a billing report in status ${report.status}`)
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.billingReport.update({
        where: { id },
        data: { status: BillingReportStatus.FINALIZED },
      })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'billing_report.finalized',
        entityType: 'BillingReport',
        entityId: id,
        metadata: { previousStatus: report.status },
      })
      return result
    })

    return this.mapBillingReportToOutput(updated)
  }

  /** FINALIZED → PAID_OUT (docs/domain-model.md § Billing Report lifecycle). */
  async markBillingReportPaidOut(
    user: AuthenticatedUser,
    id: string,
  ): Promise<BillingReportOutput> {
    const report = await this.findBillingReportRow(user, id)
    if (report.status !== BillingReportStatus.FINALIZED) {
      throw new ConflictException(
        `Cannot mark a billing report in status ${report.status} as paid out`,
      )
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.billingReport.update({
        where: { id },
        data: { status: BillingReportStatus.PAID_OUT },
      })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'billing_report.paid_out',
        entityType: 'BillingReport',
        entityId: id,
        metadata: { previousStatus: report.status },
      })
      return result
    })

    return this.mapBillingReportToOutput(updated)
  }

  // ---------------------------------------------------------------------
  // Revenue Report — computed on read, same formula as BillingReport
  // ---------------------------------------------------------------------

  async getRevenueReport(
    user: AuthenticatedUser,
    filter: RevenueReportFilterInput | undefined,
  ): Promise<RevenueReportOutput> {
    const partnerId = this.resolvePartnerScope(user, filter?.partnerId ?? undefined)
    const granularity = filter?.granularity ?? RevenueBucketGranularity.MONTH
    const dateRange = filter?.dateRange ?? undefined
    this.requireBoundedDateRangeForAdmin(partnerId, dateRange)

    const where: Prisma.InvoiceWhereInput = {
      status: { in: REVENUE_ELIGIBLE_INVOICE_STATUSES },
      issuedAt: {
        not: null,
        ...(dateRange !== undefined && { gte: dateRange.from, lte: dateRange.to }),
      },
      ...(partnerId !== undefined && { partnerId }),
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: { partnerId: true, amountDue: true, issuedAt: true },
    })

    const partnerIds = [...new Set(invoices.map((invoice) => invoice.partnerId))]
    const partners = await this.prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, commissionRate: true },
    })
    const commissionRateByPartnerId = new Map(partners.map((p) => [p.id, p.commissionRate]))

    let totalGrossRevenue = new Prisma.Decimal(0)
    let totalCommission = new Prisma.Decimal(0)
    const buckets = new Map<
      string,
      { start: Date; end: Date; grossRevenue: Prisma.Decimal; invoiceCount: number }
    >()

    for (const invoice of invoices) {
      totalGrossRevenue = totalGrossRevenue.plus(invoice.amountDue)
      const commissionRate =
        commissionRateByPartnerId.get(invoice.partnerId) ?? new Prisma.Decimal(0)
      totalCommission = totalCommission.plus(invoice.amountDue.times(commissionRate).dividedBy(100))

      // issuedAt is guaranteed non-null by the `not: null` filter above, but
      // the Prisma-generated type is still `Date | null` — the select
      // doesn't narrow it.
      const issuedAt = invoice.issuedAt as Date
      const { start, end } = this.getBucketRange(issuedAt, granularity)
      const key = start.toISOString()
      const existing = buckets.get(key)
      if (existing === undefined) {
        buckets.set(key, { start, end, grossRevenue: invoice.amountDue, invoiceCount: 1 })
      } else {
        existing.grossRevenue = existing.grossRevenue.plus(invoice.amountDue)
        existing.invoiceCount += 1
      }
    }

    const trend: RevenueReportBucketOutput[] = [...buckets.values()]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((bucket) => ({
        bucketStart: bucket.start,
        bucketEnd: bucket.end,
        grossRevenue: bucket.grossRevenue,
        invoiceCount: bucket.invoiceCount,
      }))

    return {
      totalGrossRevenue,
      totalCommission,
      totalNetPayout: totalGrossRevenue.minus(totalCommission),
      invoiceCount: invoices.length,
      trend,
    }
  }

  // ---------------------------------------------------------------------
  // Orders Report — computed on read
  // ---------------------------------------------------------------------

  async getOrdersReport(
    user: AuthenticatedUser,
    filter: OrdersReportFilterInput | undefined,
  ): Promise<OrdersReportOutput> {
    const partnerId = this.resolvePartnerScope(user, filter?.partnerId ?? undefined)
    const dateRange = filter?.dateRange ?? undefined

    const where: Prisma.OrderWhereInput = {
      ...(partnerId !== undefined && { partnerId }),
      ...(dateRange !== undefined && { createdAt: { gte: dateRange.from, lte: dateRange.to } }),
    }

    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { total: true },
    })

    const totalOrders = grouped.reduce((sum, group) => sum + group._count._all, 0)
    // CANCELLED orders were never fulfilled — excluded from revenue/average,
    // same convention as ProductPerformance's "sold" definition below.
    const revenueEligible = grouped.filter((group) => group.status !== OrderStatus.CANCELLED)
    const totalRevenue = revenueEligible.reduce(
      (sum, group) => sum.plus(group._sum.total ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    )
    const revenueEligibleCount = revenueEligible.reduce((sum, group) => sum + group._count._all, 0)
    const averageOrderValue =
      revenueEligibleCount > 0
        ? totalRevenue.dividedBy(revenueEligibleCount)
        : new Prisma.Decimal(0)

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown: grouped.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),
    }
  }

  // ---------------------------------------------------------------------
  // Inventory Report — computed on read, point-in-time snapshot
  // ---------------------------------------------------------------------

  async getInventoryReport(
    user: AuthenticatedUser,
    args: GetInventoryReportArgs,
  ): Promise<InventoryReportOutput> {
    const partnerId = this.resolvePartnerScope(user, args.filter?.partnerId ?? undefined)
    const variantWhere: Prisma.ProductVariantWhereInput = {
      deletedAt: null,
      ...(partnerId !== undefined && { partnerId }),
    }

    const [totalVariants, onHandAgg, reservedAgg, lowStock] = await Promise.all([
      this.prisma.productVariant.count({ where: variantWhere }),
      this.prisma.inventory.aggregate({
        where: { productVariant: variantWhere },
        _sum: { quantityOnHand: true },
      }),
      this.prisma.inventory.aggregate({
        where: { productVariant: variantWhere },
        _sum: { quantityReserved: true },
      }),
      this.getLowStockItems(partnerId, { first: args.first, after: args.after }),
    ])

    return {
      totalVariants,
      totalOnHand: onHandAgg._sum.quantityOnHand ?? 0,
      totalReserved: reservedAgg._sum.quantityReserved ?? 0,
      lowStockCount: lowStock.lowStockCount,
      lowStockItems: lowStock.connection,
    }
  }

  /**
   * Fetches the low-stock Inventory rows (`quantityOnHand < reorderThreshold`)
   * for the caller's scope, then paginates them in application memory — the
   * cursor is a real productVariantId, not an offset (unlike ProductPerformance,
   * there is no groupBy involved here). The underlying query is `LIMIT`-bounded
   * (see fetchLowStockRows), so both the page and lowStockCount are capped at
   * MAX_LOW_STOCK_ROWS.
   */
  private async getLowStockItems(
    partnerId: string | undefined,
    args: { first?: number | undefined; after?: string | undefined },
  ): Promise<{ connection: InventoryReportItemConnectionOutput; lowStockCount: number }> {
    const first = args.first ?? DEFAULT_PAGE_SIZE

    const lowStock = await this.fetchLowStockRows(partnerId, MAX_LOW_STOCK_ROWS)
    const lowStockCount = lowStock.length

    const afterIndex =
      args.after !== undefined
        ? lowStock.findIndex((row) => row.productVariantId === decodeCursor(args.after as string)) +
          1
        : 0
    const page = lowStock.slice(afterIndex, afterIndex + first)
    const hasNextPage = afterIndex + first < lowStock.length
    const hasPreviousPage = afterIndex > 0

    const edges: InventoryReportItemEdgeOutput[] = page.map((row) => ({
      cursor: encodeCursor(row.productVariantId),
      node: {
        productVariantId: row.productVariantId,
        sku: row.sku,
        productTitle: row.productTitle,
        partnerId: row.partnerId,
        quantityOnHand: row.quantityOnHand,
        quantityReserved: row.quantityReserved,
        reorderThreshold: row.reorderThreshold,
      },
    }))

    return {
      connection: {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      },
      lowStockCount,
    }
  }

  /**
   * Low-stock is `quantityOnHand < reorderThreshold` — a cross-column
   * comparison Prisma cannot express in a `where` clause. This is the one
   * runtime query in the module that drops to `$queryRaw`, the same "raw SQL
   * only where the ORM genuinely can't express it" instinct as the
   * BillingReport GiST exclusion constraint hand-written in the migrations.
   * The SQL is a parameterized tagged template (never string-concatenated),
   * and always `LIMIT`-bounded so an Admin-unscoped call can't pull every
   * Partner's inventory into memory (F-C2). Mirrors the previous
   * `productVariant`-relation filter exactly: only pv.deleted_at IS NULL
   * (Product soft-deletes were never filtered here) plus the optional
   * partner scope.
   */
  private async fetchLowStockRows(
    partnerId: string | undefined,
    limit: number,
  ): Promise<LowStockRow[]> {
    const partnerFilter =
      partnerId !== undefined ? Prisma.sql`AND pv.partner_id = ${partnerId}::uuid` : Prisma.empty

    return this.prisma.$queryRaw<LowStockRow[]>(Prisma.sql`
      SELECT
        i.product_variant_id AS "productVariantId",
        pv.sku AS "sku",
        p.title AS "productTitle",
        pv.partner_id AS "partnerId",
        i.quantity_on_hand AS "quantityOnHand",
        i.quantity_reserved AS "quantityReserved",
        i.reorder_threshold AS "reorderThreshold"
      FROM inventory i
      JOIN product_variants pv ON pv.id = i.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE i.reorder_threshold IS NOT NULL
        AND i.quantity_on_hand < i.reorder_threshold
        AND pv.deleted_at IS NULL
        ${partnerFilter}
      ORDER BY i.product_variant_id ASC
      LIMIT ${limit}
    `)
  }

  // ---------------------------------------------------------------------
  // Customers Report — computed on read, point-in-time snapshot (SM-330)
  // ---------------------------------------------------------------------

  /**
   * `Customer` has no `partnerId` column (docs/domain-model.md § Customer) —
   * a Partner's "own" Customers are derived through Order (at least one
   * Order placed with that Partner), the exact same relation-filter
   * CustomersService.buildWhere uses. Reports never imports another
   * module's service (resolver -> service -> Prisma layering only), so this
   * predicate is re-derived here rather than shared — same tradeoff every
   * other report's ownership `where` already accepts (each re-derives
   * `resolvePartnerScope`'s result into its own entity's `where` shape).
   */
  async getCustomersReport(
    user: AuthenticatedUser,
    filter: CustomersReportFilterInput | undefined,
  ): Promise<CustomersReportOutput> {
    const partnerId = this.resolvePartnerScope(user, filter?.partnerId ?? undefined)
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(partnerId !== undefined && { orders: { some: { partnerId } } }),
    }

    const [statusGrouped, typeGrouped] = await Promise.all([
      this.prisma.customer.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.customer.groupBy({ by: ['type'], where, _count: { _all: true } }),
    ])

    return {
      totalCustomers: statusGrouped.reduce((sum, group) => sum + group._count._all, 0),
      statusBreakdown: statusGrouped.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),
      typeBreakdown: typeGrouped.map((group) => ({ type: group.type, count: group._count._all })),
    }
  }

  // ---------------------------------------------------------------------
  // Product Performance Report — computed on read, offset-cursor (see
  // ProductPerformanceConnectionOutput's doc comment for why)
  // ---------------------------------------------------------------------

  async getProductPerformanceReport(
    user: AuthenticatedUser,
    args: GetProductPerformanceReportArgs,
  ): Promise<ProductPerformanceConnectionOutput> {
    const partnerId = this.resolvePartnerScope(user, args.filter?.partnerId ?? undefined)
    const dateRange = args.filter?.dateRange ?? undefined
    this.requireBoundedDateRangeForAdmin(partnerId, dateRange)
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const startOffset = args.after !== undefined ? this.decodeOffsetCursor(args.after) + 1 : 0

    const where: Prisma.OrderItemWhereInput = {
      order: {
        status: { not: OrderStatus.CANCELLED },
        ...(partnerId !== undefined && { partnerId }),
        ...(dateRange !== undefined && { createdAt: { gte: dateRange.from, lte: dateRange.to } }),
      },
    }

    // Sorted/paginated in application memory rather than via Prisma's
    // `orderBy`/`skip`/`take` on the groupBy itself: Prisma's TypeScript
    // types validate `orderBy` against `by`/`_sum` via a literal conditional
    // type that only resolves when the whole args object is an inline
    // literal — routing it through a variable (needed here, since the sort
    // field is chosen at runtime) breaks that inference. Bounded by a
    // scoped Partner's own catalog size, same accepted tradeoff as
    // getLowStockItems' in-memory filter+paginate above.
    const allGroups = await this.prisma.orderItem.groupBy({
      by: ['productVariantId'],
      where,
      _sum: { quantity: true, lineTotal: true },
    })
    const sortedGroups = this.sortProductPerformanceGroups(allGroups, args.sort)

    const hasNextPage = startOffset + first < sortedGroups.length
    const page = sortedGroups.slice(startOffset, startOffset + first)

    // Deliberately no `deletedAt: null` here, unlike every other query in
    // this file — these ids come from OrderItem.groupBy above, i.e. real
    // historical sales. A discontinued/deleted variant's past revenue is
    // still real revenue; hiding it would understate this report's totals
    // for exactly the products a Partner most needs to see performance on
    // (v1.0 Release Readiness Audit finding F-M13).
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: page.map((group) => group.productVariantId) } },
      include: { product: true },
    })
    const variantById = new Map(variants.map((variant) => [variant.id, variant]))

    const edges: ProductPerformanceEdgeOutput[] = page.map((group, index) => {
      const variant = variantById.get(group.productVariantId)
      return {
        cursor: this.encodeOffsetCursor(startOffset + index),
        node: {
          productVariantId: group.productVariantId,
          sku: variant?.sku ?? '',
          productTitle: variant?.product.title ?? '',
          partnerId: variant?.partnerId ?? '',
          unitsSold: group._sum.quantity ?? 0,
          revenue: group._sum.lineTotal ?? new Prisma.Decimal(0),
        },
      }
    })

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: startOffset > 0,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    }
  }

  // ---------------------------------------------------------------------
  // Notification Activity Report — computed on read
  // ---------------------------------------------------------------------

  async getNotificationActivityReport(
    user: AuthenticatedUser,
    filter: NotificationActivityReportFilterInput | undefined,
  ): Promise<NotificationActivityReportOutput> {
    const partnerId = this.resolvePartnerScope(user, filter?.partnerId ?? undefined)
    const dateRange = filter?.dateRange ?? undefined

    // Scoped to Partner-staff recipients only (recipient.partnerId not
    // null when Admin omits partnerId) — "Partner-owned" Reports scope
    // (per the plan) excludes pure Customer/Admin notification traffic,
    // which has no Partner owner to report against. Deliberately never
    // filters recipient.status/deletedAt (unlike
    // NotificationsService.fanOut's live-recipient filter) — a report
    // reflects historical activity regardless of current recipient status.
    const where: Prisma.NotificationWhereInput = {
      recipient: partnerId !== undefined ? { partnerId } : { partnerId: { not: null } },
      ...(dateRange !== undefined && { createdAt: { gte: dateRange.from, lte: dateRange.to } }),
    }

    const [totalNotifications, unreadCount, grouped] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.UNREAD } }),
      this.prisma.notification.groupBy({ by: ['type'], where, _count: { _all: true } }),
    ])

    return {
      totalNotifications,
      unreadCount,
      readCount: totalNotifications - unreadCount,
      typeBreakdown: grouped.map((group) => ({
        type: group.type as NotificationType,
        count: group._count._all,
      })),
    }
  }

  // ---------------------------------------------------------------------
  // Reports Dashboard — its own query, composed from the reports above;
  // never touches DashboardService/dashboardStats (M11 stays untouched).
  // ---------------------------------------------------------------------

  async getReportsDashboard(
    user: AuthenticatedUser,
    filter: ReportsDashboardFilterInput | undefined,
  ): Promise<ReportsDashboardOutput> {
    const partnerId = filter?.partnerId ?? undefined
    const dateRange = filter?.dateRange ?? undefined

    const [revenue, orders, inventory] = await Promise.all([
      this.getRevenueReport(
        user,
        this.buildPartnerDateFilter<RevenueReportFilterInput>(partnerId, dateRange),
      ),
      this.getOrdersReport(
        user,
        this.buildPartnerDateFilter<OrdersReportFilterInput>(partnerId, dateRange),
      ),
      this.getInventoryReport(user, {
        first: 1,
        filter: this.buildPartnerFilter<InventoryReportFilterInput>(partnerId),
      }),
    ])

    return {
      grossRevenue: revenue.totalGrossRevenue,
      totalOrders: orders.totalOrders,
      ordersRevenue: orders.totalRevenue,
      lowStockCount: inventory.lowStockCount,
      revenueTrend: revenue.trend,
    }
  }

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------

  async exportReport(user: AuthenticatedUser, input: ExportReportInput): Promise<string> {
    if (input.format === ReportExportFormat.EXCEL) {
      throw new BadRequestException('Excel export is not yet supported')
    }

    switch (input.reportType) {
      case ReportExportType.BILLING_REPORTS:
        return this.exportBillingReportsCsv(user, input)
      case ReportExportType.REVENUE:
        return this.exportRevenueReportCsv(user, input)
      case ReportExportType.ORDERS:
        return this.exportOrdersReportCsv(user, input)
      case ReportExportType.INVENTORY:
        return this.exportInventoryReportCsv(user, input)
      case ReportExportType.PRODUCT_PERFORMANCE:
        return this.exportProductPerformanceCsv(user, input)
      case ReportExportType.NOTIFICATION_ACTIVITY:
        return this.exportNotificationActivityCsv(user, input)
      case ReportExportType.CUSTOMERS:
        return this.exportCustomersReportCsv(user, input)
    }
  }

  private async exportBillingReportsCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const where = this.buildBillingReportWhere(
      user,
      this.buildPartnerFilter<BillingReportFilterInput>(input.partnerId),
    )
    const reports = await this.prisma.billingReport.findMany({
      where,
      orderBy: this.buildBillingReportOrderBy(undefined),
      take: CSV_EXPORT_MAX_ROWS + 1,
    })
    this.assertExportRowCountWithinCap(reports.length)
    return buildCsv(
      [
        'partnerId',
        'periodStart',
        'periodEnd',
        'grossRevenue',
        'commissionAmount',
        'netPayout',
        'status',
      ],
      reports.map((report) => [
        report.partnerId,
        report.periodStart.toISOString(),
        report.periodEnd.toISOString(),
        report.grossRevenue.toString(),
        report.commissionAmount.toString(),
        report.netPayout.toString(),
        report.status,
      ]),
    )
  }

  private async exportRevenueReportCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const report = await this.getRevenueReport(
      user,
      this.buildPartnerDateFilter<RevenueReportFilterInput>(input.partnerId, input.dateRange),
    )
    return buildCsv(
      ['bucketStart', 'bucketEnd', 'grossRevenue', 'invoiceCount'],
      report.trend.map((bucket) => [
        bucket.bucketStart.toISOString(),
        bucket.bucketEnd.toISOString(),
        bucket.grossRevenue.toString(),
        String(bucket.invoiceCount),
      ]),
    )
  }

  private async exportOrdersReportCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const report = await this.getOrdersReport(
      user,
      this.buildPartnerDateFilter<OrdersReportFilterInput>(input.partnerId, input.dateRange),
    )
    return buildCsv(
      ['status', 'count'],
      report.statusBreakdown.map((entry) => [entry.status, String(entry.count)]),
    )
  }

  private async exportInventoryReportCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const partnerId = this.resolvePartnerScope(user, input.partnerId)
    // Fetch one past the cap so an over-cap export is rejected outright rather
    // than silently truncated (F-H4). Same $queryRaw path as the read report.
    const lowStock = await this.fetchLowStockRows(partnerId, CSV_EXPORT_MAX_ROWS + 1)
    this.assertExportRowCountWithinCap(lowStock.length)
    return buildCsv(
      [
        'productVariantId',
        'sku',
        'productTitle',
        'partnerId',
        'quantityOnHand',
        'quantityReserved',
        'reorderThreshold',
      ],
      lowStock.map((row) => [
        row.productVariantId,
        row.sku,
        row.productTitle,
        row.partnerId,
        String(row.quantityOnHand),
        String(row.quantityReserved),
        String(row.reorderThreshold),
      ]),
    )
  }

  private async exportProductPerformanceCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const partnerId = this.resolvePartnerScope(user, input.partnerId)
    const where: Prisma.OrderItemWhereInput = {
      order: {
        status: { not: OrderStatus.CANCELLED },
        ...(partnerId !== undefined && { partnerId }),
        ...(input.dateRange !== undefined && {
          createdAt: { gte: input.dateRange.from, lte: input.dateRange.to },
        }),
      },
    }
    const groups = await this.prisma.orderItem.groupBy({
      by: ['productVariantId'],
      where,
      _sum: { quantity: true, lineTotal: true },
      orderBy: [{ _sum: { lineTotal: 'desc' } }],
      take: CSV_EXPORT_MAX_ROWS + 1,
    })
    this.assertExportRowCountWithinCap(groups.length)
    // Same deliberate omission of `deletedAt: null` as the read path above —
    // historical revenue for a since-discontinued variant is still real
    // revenue (F-M13).
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: groups.map((group) => group.productVariantId) } },
      include: { product: true },
    })
    const variantById = new Map(variants.map((variant) => [variant.id, variant]))
    return buildCsv(
      ['productVariantId', 'sku', 'productTitle', 'partnerId', 'unitsSold', 'revenue'],
      groups.map((group) => {
        const variant = variantById.get(group.productVariantId)
        return [
          group.productVariantId,
          variant?.sku ?? '',
          variant?.product.title ?? '',
          variant?.partnerId ?? '',
          String(group._sum.quantity ?? 0),
          (group._sum.lineTotal ?? new Prisma.Decimal(0)).toString(),
        ]
      }),
    )
  }

  private async exportNotificationActivityCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const report = await this.getNotificationActivityReport(
      user,
      this.buildPartnerDateFilter<NotificationActivityReportFilterInput>(
        input.partnerId,
        input.dateRange,
      ),
    )
    return buildCsv(
      ['type', 'count'],
      report.typeBreakdown.map((entry) => [entry.type, String(entry.count)]),
    )
  }

  private async exportCustomersReportCsv(
    user: AuthenticatedUser,
    input: ExportReportInput,
  ): Promise<string> {
    const report = await this.getCustomersReport(
      user,
      this.buildPartnerFilter<CustomersReportFilterInput>(input.partnerId),
    )
    return buildCsv(
      ['dimension', 'value', 'count'],
      [
        ...report.statusBreakdown.map((entry) => ['status', entry.status, String(entry.count)]),
        ...report.typeBreakdown.map((entry) => ['type', entry.type, String(entry.count)]),
      ],
    )
  }

  // ---------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------

  /**
   * Builds a `{ partnerId?, dateRange? }`-shaped filter object with the key
   * omitted (not present-with-value-`undefined`) whenever the source value
   * is `undefined` — required because this project's `tsconfig` sets
   * `exactOptionalPropertyTypes: true`, under which `{ partnerId: undefined }`
   * is not assignable to a target type declaring `partnerId?: string`. Used
   * everywhere a caller needs to build one report's filter DTO out of
   * another's already-resolved values (ReportsDashboard/exportReport
   * composing the per-report getters rather than re-implementing them).
   */
  private buildPartnerDateFilter<T extends { partnerId?: string; dateRange?: DateRangeInput }>(
    partnerId: string | undefined,
    dateRange: DateRangeInput | undefined,
  ): T {
    return {
      ...(partnerId !== undefined && { partnerId }),
      ...(dateRange !== undefined && { dateRange }),
    } as T
  }

  /** Same as buildPartnerDateFilter, for filter DTOs with no dateRange field (e.g. Inventory). */
  private buildPartnerFilter<T extends { partnerId?: string }>(partnerId: string | undefined): T {
    return { ...(partnerId !== undefined && { partnerId }) } as T
  }

  /**
   * An Admin-unscoped historical report (no Partner floor and no date range)
   * would scan and aggregate the entire marketplace's ledger into Node memory
   * (F-C2). Require a bounded date range whenever an Admin caller has not
   * narrowed to a single Partner. Partner-scoped callers are naturally bounded
   * by their own tenant size (`partnerId` is always defined for them here) and
   * are deliberately never subject to this — passing `partnerId === undefined`
   * is only ever reachable by an Admin who supplied no partner filter.
   */
  private requireBoundedDateRangeForAdmin(
    partnerId: string | undefined,
    dateRange: DateRangeInput | undefined,
  ): void {
    if (partnerId === undefined && dateRange === undefined) {
      throw new BadRequestException(
        'A date range is required for this report when it is not scoped to a single partner.',
      )
    }
  }

  /**
   * Enforces the synchronous CSV export ceiling (F-H4). Callers fetch one row
   * past the cap (`take: CSV_EXPORT_MAX_ROWS + 1`) and pass the resulting
   * length here, so an over-cap export is rejected with an explicit,
   * filter-narrowing error rather than being silently truncated.
   */
  private assertExportRowCountWithinCap(rowCount: number): void {
    if (rowCount > CSV_EXPORT_MAX_ROWS) {
      throw new BadRequestException(
        `This export exceeds the ${CSV_EXPORT_MAX_ROWS.toLocaleString('en-US')}-row limit. ` +
          'Narrow your filter (by partner and/or date range) and try again.',
      )
    }
  }

  /**
   * Ownership derives from the caller's own provisioned organization
   * (docs/authorization.md § Ownership Rules): a Partner-scoped caller is
   * always floored to their own partnerId (a request for another Partner's
   * data is rejected outright, not silently re-scoped); Admin
   * (partnerId null) sees everything unless a specific partnerId narrows
   * the view. There is no Customer branch — Customers hold no
   * `reports:read` permission at all, enforced at the resolver, so this is
   * never reached for one.
   */
  private resolvePartnerScope(
    user: AuthenticatedUser,
    requestedPartnerId?: string,
  ): string | undefined {
    if (user.partnerId !== null) {
      if (requestedPartnerId !== undefined && requestedPartnerId !== user.partnerId) {
        throw new ForbiddenException("Cannot view another Partner's reports")
      }
      return user.partnerId
    }
    return requestedPartnerId
  }

  /** Same as resolvePartnerScope, but generateBillingReport has no "for all partners" bulk op. */
  private resolveRequiredPartnerScope(
    user: AuthenticatedUser,
    requestedPartnerId?: string,
  ): string {
    if (user.partnerId !== null) return user.partnerId
    if (requestedPartnerId === undefined) {
      throw new BadRequestException(
        'partnerId is required when generating a billing report as Admin',
      )
    }
    return requestedPartnerId
  }

  private async findBillingReportRow(user: AuthenticatedUser, id: string): Promise<BillingReport> {
    const report = await this.prisma.billingReport.findUnique({ where: { id } })
    // Ownership miss reads as NOT_FOUND, never FORBIDDEN (docs/authorization.md
    // § Ownership Rules) — same pattern as BillingService.findInvoiceById.
    if (report === null || (user.partnerId !== null && report.partnerId !== user.partnerId)) {
      throw new NotFoundException('Billing report not found')
    }
    return report
  }

  private buildBillingReportWhere(
    user: AuthenticatedUser,
    filter: BillingReportFilterInput | undefined,
  ): Prisma.BillingReportWhereInput {
    const where: Prisma.BillingReportWhereInput = {}
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

  // `id` breaks ties for a fully-determined total order across cursor
  // pages, same reasoning as BillingService.buildOrderBy.
  private buildBillingReportOrderBy(
    sort: BillingReportSortInput | undefined,
  ): Prisma.BillingReportOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === BillingReportSortField.PERIOD_START) {
      return [{ periodStart: direction }, { id: 'asc' }]
    }
    if (sort?.field === BillingReportSortField.GROSS_REVENUE) {
      return [{ grossRevenue: direction }, { id: 'asc' }]
    }
    return [{ generatedAt: direction }, { id: 'asc' }]
  }

  // Sorts in application memory rather than via Prisma's groupBy `orderBy`
  // — see getProductPerformanceReport's call-site comment for why. `id`
  // (productVariantId) is the tie-break for a fully-determined order,
  // same reasoning as every other list's cursor stability.
  private sortProductPerformanceGroups<
    T extends {
      productVariantId: string
      _sum: { quantity: number | null; lineTotal: Prisma.Decimal | null }
    },
  >(groups: T[], sort: ProductPerformanceSortInput | undefined): T[] {
    const direction = sort?.direction === SortDirection.ASC ? 1 : -1
    const byUnitsSold = sort?.field === ProductPerformanceSortField.UNITS_SOLD

    return [...groups].sort((a, b) => {
      if (byUnitsSold) {
        const diff = (a._sum.quantity ?? 0) - (b._sum.quantity ?? 0)
        return diff !== 0 ? diff * direction : a.productVariantId.localeCompare(b.productVariantId)
      }
      const aRevenue = a._sum.lineTotal ?? new Prisma.Decimal(0)
      const bRevenue = b._sum.lineTotal ?? new Prisma.Decimal(0)
      const comparison = aRevenue.comparedTo(bRevenue)
      return comparison !== 0
        ? comparison * direction
        : a.productVariantId.localeCompare(b.productVariantId)
    })
  }

  private mapBillingReportToOutput(report: BillingReport): BillingReportOutput {
    return {
      id: report.id,
      partnerId: report.partnerId,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      grossRevenue: report.grossRevenue,
      commissionAmount: report.commissionAmount,
      netPayout: report.netPayout,
      status: report.status,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }
  }

  /**
   * `error.message`-based translation is required, not just a shortcut:
   * the GiST exclusion constraint (`billing_reports_no_overlapping_periods_excl`,
   * SQLSTATE 23P01) is hand-written in the migration, not declared in
   * schema.prisma, so Prisma has no known error code for it — it surfaces
   * as `PrismaClientUnknownRequestError` with the Postgres detail embedded
   * in `.message`, never `.code`. Verified directly against a real Postgres
   * instance (not assumed) before this mapping was written — see
   * reports.e2e-spec.ts's overlap-rejection test.
   */
  private translateBillingReportError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A billing report for this exact period already exists')
    }
    if (
      error instanceof Prisma.PrismaClientUnknownRequestError &&
      error.message.includes('billing_reports_no_overlapping_periods_excl')
    ) {
      throw new ConflictException(
        'This period overlaps an existing billing report for this Partner',
      )
    }
    throw error
  }

  private getBucketRange(
    date: Date,
    granularity: RevenueBucketGranularity,
  ): { start: Date; end: Date } {
    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

    if (granularity === RevenueBucketGranularity.DAY) {
      const end = new Date(day)
      end.setUTCDate(end.getUTCDate() + 1)
      end.setUTCMilliseconds(end.getUTCMilliseconds() - 1)
      return { start: day, end }
    }

    if (granularity === RevenueBucketGranularity.WEEK) {
      // ISO-ish week starting Monday: getUTCDay() is 0=Sun..6=Sat, so the
      // offset back to Monday is (day + 6) % 7.
      const dayOfWeek = day.getUTCDay()
      const offsetToMonday = (dayOfWeek + 6) % 7
      const start = new Date(day)
      start.setUTCDate(start.getUTCDate() - offsetToMonday)
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 7)
      end.setUTCMilliseconds(end.getUTCMilliseconds() - 1)
      return { start, end }
    }

    // MONTH
    const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1))
    const end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 1))
    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1)
    return { start, end }
  }

  // Offset-encoded cursor for ProductPerformance only — see
  // ProductPerformanceConnectionOutput's doc comment for why groupBy can't
  // use a real id-based cursor like every other list in this codebase.
  private encodeOffsetCursor(offset: number): string {
    return Buffer.from(`offset:${offset}`, 'utf8').toString('base64')
  }

  private decodeOffsetCursor(cursor: string): number {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8')
    const match = /^offset:(\d+)$/.exec(decoded)
    if (match === null || match[1] === undefined) throw new BadRequestException('Invalid cursor')
    return Number(match[1])
  }
}
