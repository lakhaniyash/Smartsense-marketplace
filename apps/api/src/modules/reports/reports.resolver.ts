import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { BillingReportConnectionOutput } from './dto/billing-report-connection.output'
import { BillingReportFilterInput } from './dto/billing-report-filter.input'
import { BillingReportSortInput } from './dto/billing-report-sort.input'
import { BillingReportOutput } from './dto/billing-report.output'
import { ExportReportInput } from './dto/export-report.input'
import { GenerateBillingReportInput } from './dto/generate-billing-report.input'
import { InventoryReportFilterInput } from './dto/inventory-report-filter.input'
import { InventoryReportOutput } from './dto/inventory-report.output'
import { NotificationActivityReportFilterInput } from './dto/notification-activity-report-filter.input'
import { NotificationActivityReportOutput } from './dto/notification-activity-report.output'
import { OrdersReportFilterInput } from './dto/orders-report-filter.input'
import { OrdersReportOutput } from './dto/orders-report.output'
import { ProductPerformanceConnectionOutput } from './dto/product-performance-connection.output'
import { ProductPerformanceFilterInput } from './dto/product-performance-filter.input'
import { ProductPerformanceSortInput } from './dto/product-performance-sort.input'
import { RevenueReportFilterInput } from './dto/revenue-report-filter.input'
import { RevenueReportOutput } from './dto/revenue-report.output'
import { ReportsDashboardFilterInput } from './dto/reports-dashboard-filter.input'
import { ReportsDashboardOutput } from './dto/reports-dashboard.output'
import { ReportsService } from './reports.service'

// Every operation in this resolver is gated on the single `reports:read`
// permission (docs/authorization.md § Reports) — it covers both viewing
// and generating every report type here, Admin: all Partners, Partner:
// own only (enforced in ReportsService, not just this guard), Customer:
// no access at all.
@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Permissions('reports:read')
  @Query(() => BillingReportConnectionOutput, {
    name: 'billingReports',
    description: "A page of the caller's visible billing reports (Admin: all; Partner: own).",
  })
  billingReports(
    @CurrentUser() user: AuthenticatedUser,
    // See OrdersResolver.orders for why every arg admits null as well as
    // undefined — same exactOptionalPropertyTypes reasoning applies here.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => BillingReportFilterInput, nullable: true })
    filter?: BillingReportFilterInput | null,
    @Args('sort', { type: () => BillingReportSortInput, nullable: true })
    sort?: BillingReportSortInput | null,
  ): Promise<BillingReportConnectionOutput> {
    return this.reportsService.findBillingReports(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('reports:read')
  @Query(() => BillingReportOutput, {
    name: 'billingReport',
    description:
      'A single billing report by id, scoped to the caller. Throws NOT_FOUND rather than ' +
      'returning null on a missing or out-of-scope id.',
  })
  billingReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BillingReportOutput> {
    return this.reportsService.findBillingReportById(user, id)
  }

  @Permissions('reports:read')
  @Mutation(() => BillingReportOutput, {
    name: 'generateBillingReport',
    description:
      'Generates a BillingReport for a Partner/period, reconciling gross revenue/commission/net ' +
      'payout from the Invoice ledger. Rejects an overlapping period (any Partner-scoped period ' +
      'that intersects an existing one) with CONFLICT.',
  })
  generateBillingReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: GenerateBillingReportInput,
  ): Promise<BillingReportOutput> {
    return this.reportsService.generateBillingReport(user, input)
  }

  @Permissions('reports:read')
  @Mutation(() => BillingReportOutput, {
    name: 'finalizeBillingReport',
    description: 'GENERATED → FINALIZED (docs/domain-model.md § Billing Report lifecycle).',
  })
  finalizeBillingReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BillingReportOutput> {
    return this.reportsService.finalizeBillingReport(user, id)
  }

  @Permissions('reports:read')
  @Mutation(() => BillingReportOutput, {
    name: 'markBillingReportPaidOut',
    description: 'FINALIZED → PAID_OUT (docs/domain-model.md § Billing Report lifecycle).',
  })
  markBillingReportPaidOut(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BillingReportOutput> {
    return this.reportsService.markBillingReportPaidOut(user, id)
  }

  @Permissions('reports:read')
  @Query(() => RevenueReportOutput, {
    name: 'revenueReport',
    description: 'Invoice-ledger-derived revenue summary + trend for the scoped Partner(s)/period.',
  })
  revenueReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('filter', { type: () => RevenueReportFilterInput, nullable: true })
    filter?: RevenueReportFilterInput | null,
  ): Promise<RevenueReportOutput> {
    return this.reportsService.getRevenueReport(user, filter ?? undefined)
  }

  @Permissions('reports:read')
  @Query(() => OrdersReportOutput, {
    name: 'ordersReport',
    description: 'Order-volume summary + status breakdown for the scoped Partner(s)/period.',
  })
  ordersReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('filter', { type: () => OrdersReportFilterInput, nullable: true })
    filter?: OrdersReportFilterInput | null,
  ): Promise<OrdersReportOutput> {
    return this.reportsService.getOrdersReport(user, filter ?? undefined)
  }

  @Permissions('reports:read')
  @Query(() => InventoryReportOutput, {
    name: 'inventoryReport',
    description:
      'A point-in-time inventory snapshot for the scoped Partner(s), including a paginated ' +
      'low-stock item connection.',
  })
  inventoryReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => InventoryReportFilterInput, nullable: true })
    filter?: InventoryReportFilterInput | null,
  ): Promise<InventoryReportOutput> {
    return this.reportsService.getInventoryReport(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
    })
  }

  @Permissions('reports:read')
  @Query(() => ProductPerformanceConnectionOutput, {
    name: 'productPerformanceReport',
    description:
      'Units-sold/revenue ranking of Product Variants for the scoped Partner(s)/period. Uses an ' +
      "offset-encoded cursor (see ProductPerformanceConnectionOutput's doc comment) since " +
      "Prisma's groupBy has no cursor support.",
  })
  productPerformanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => ProductPerformanceFilterInput, nullable: true })
    filter?: ProductPerformanceFilterInput | null,
    @Args('sort', { type: () => ProductPerformanceSortInput, nullable: true })
    sort?: ProductPerformanceSortInput | null,
  ): Promise<ProductPerformanceConnectionOutput> {
    return this.reportsService.getProductPerformanceReport(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('reports:read')
  @Query(() => NotificationActivityReportOutput, {
    name: 'notificationActivityReport',
    description:
      "Historical Notification volume for the scoped Partner's staff recipients, by type/status.",
  })
  notificationActivityReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('filter', { type: () => NotificationActivityReportFilterInput, nullable: true })
    filter?: NotificationActivityReportFilterInput | null,
  ): Promise<NotificationActivityReportOutput> {
    return this.reportsService.getNotificationActivityReport(user, filter ?? undefined)
  }

  @Permissions('reports:read')
  @Query(() => ReportsDashboardOutput, {
    name: 'reportsDashboard',
    description:
      'KPI + trend summary for the Reports landing page. A dedicated query — never touches ' +
      'dashboardStats (the M11 marketplace-wide overview card).',
  })
  reportsDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Args('filter', { type: () => ReportsDashboardFilterInput, nullable: true })
    filter?: ReportsDashboardFilterInput | null,
  ): Promise<ReportsDashboardOutput> {
    return this.reportsService.getReportsDashboard(user, filter ?? undefined)
  }

  @Permissions('reports:read')
  @Query(() => String, {
    name: 'exportReport',
    description:
      'Renders the requested report as a raw CSV string, matching the given filter. EXCEL ' +
      'format is a not-yet-implemented placeholder (throws BAD_USER_INPUT today).',
  })
  exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: ExportReportInput,
  ): Promise<string> {
    return this.reportsService.exportReport(user, input)
  }
}
