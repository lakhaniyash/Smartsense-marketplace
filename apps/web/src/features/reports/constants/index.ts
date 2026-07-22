import type { ComponentType, SVGProps } from 'react'
import { ROUTES } from '@shared/constants'
import {
  BillingReportsIcon,
  CustomersIcon,
  InventoryIcon,
  NotificationsIcon,
  OrdersIcon,
  ProductPerformanceIcon,
  RevenueIcon,
} from '@shared/icons'
import { resolveDateRangePreset } from '@shared/utils'

export interface ReportNavItem {
  key: string
  title: string
  description: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

// Drives the Reports Dashboard's link grid (ReportsNavCard × 6) — one entry
// per route under the single `reports:read` PermissionRoute block
// (apps/web/src/app/router/index.tsx).
export const REPORTS_NAV_ITEMS: ReportNavItem[] = [
  {
    key: 'revenue',
    title: 'Revenue',
    description: 'Invoice-ledger revenue summary and trend.',
    href: ROUTES.REPORTS_REVENUE,
    icon: RevenueIcon,
  },
  {
    key: 'orders',
    title: 'Orders',
    description: 'Order volume, revenue, and status breakdown.',
    href: ROUTES.REPORTS_ORDERS,
    icon: OrdersIcon,
  },
  {
    key: 'inventory',
    title: 'Inventory',
    description: 'Stock levels and low-stock alerts.',
    href: ROUTES.REPORTS_INVENTORY,
    icon: InventoryIcon,
  },
  {
    key: 'product-performance',
    title: 'Product Performance',
    description: 'Units sold and revenue ranked by product.',
    href: ROUTES.REPORTS_PRODUCT_PERFORMANCE,
    icon: ProductPerformanceIcon,
  },
  {
    key: 'notification-activity',
    title: 'Notification Activity',
    description: 'Notification volume by type and read status.',
    href: ROUTES.REPORTS_NOTIFICATION_ACTIVITY,
    icon: NotificationsIcon,
  },
  {
    key: 'billing-reports',
    title: 'Billing Reports',
    description: 'Generate and manage per-partner billing statements.',
    href: ROUTES.REPORTS_BILLING_REPORTS,
    icon: BillingReportsIcon,
  },
  {
    key: 'customers',
    title: 'Customers',
    description: 'Customer count by status and type.',
    href: ROUTES.REPORTS_CUSTOMERS,
    icon: CustomersIcon,
  },
]

// Every report's `DateRangeInput` is built from the two plain `yyyy-mm-dd`
// strings DateRangePicker/resolveDateRangePreset produce
// (shared/utils/resolveDateRangePreset.ts) — `from` floors to that day's
// start, `to` ceils to its end, so the inclusive [from, to] range
// (schema.gql's `DateRangeInput` doc comment) never silently drops the last
// day's activity to a midnight cutoff.
//
// The two strings are parsed as *local* calendar dates (no trailing `Z`),
// matching resolveDateRangePreset.ts's own "yyyy-mm-dd in the local
// timezone" convention, and only converted to a UTC instant via
// `toISOString()` at the end — appending a literal `T00:00:00.000Z`/
// `T23:59:59.999Z` directly would silently treat the picked calendar day as
// a UTC day, which renders as the *next* local day once redisplayed
// (`toLocaleDateString()`) in any timezone ahead of UTC.
export function toDateRangeInput(filters: {
  from?: string | undefined
  to?: string | undefined
}): { from: string; to: string } | undefined {
  if (filters.from === undefined || filters.to === undefined) return undefined
  return {
    from: new Date(`${filters.from}T00:00:00.000`).toISOString(),
    to: new Date(`${filters.to}T23:59:59.999`).toISOString(),
  }
}

// Every date-ranged report hook falls back to a trailing 30-day window when
// the URL carries no explicit `from`/`to` (rather than leaving both
// `undefined`) — an Admin caller with no partner filter and no date range
// would otherwise hit reports.service.ts's own `requireBoundedDateRangeForAdmin`
// guard (F-C2) on first, unfiltered visit to any of these pages. Matches
// common dashboard UX (a bounded default window) as well as the guard's
// requirement — both, not either, are the point.
export function resolveReportDateRangeParams(searchParams: URLSearchParams): {
  from: string
  to: string
} {
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (from !== null && to !== null) return { from, to }
  return resolveDateRangePreset('last30Days')
}
