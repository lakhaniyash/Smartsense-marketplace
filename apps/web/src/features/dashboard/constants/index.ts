import type { DashboardStatsQuery } from '@lib/graphql/__generated__/graphql'
import { CustomersIcon, OrdersIcon, ProductsIcon, RevenueIcon } from '@shared/icons'
import { ROUTES } from '@shared/constants'
import type { DashboardIcon } from '../types'

type DashboardStatKey = keyof Omit<DashboardStatsQuery['dashboardStats'], '__typename'>

interface StatCardDefinition {
  key: DashboardStatKey
  label: string
  permission: string
  icon: DashboardIcon
}

// One entry per mock field on the `dashboardStats` query (M11) — each is
// replaced by a real count once its owning module (Catalog/Orders, M12–M13)
// ships. Order here is the render order in the stats grid.
export const STAT_CARD_DEFINITIONS: readonly StatCardDefinition[] = [
  { key: 'totalProducts', label: 'Total Products', permission: 'catalog:read', icon: ProductsIcon },
  { key: 'totalOrders', label: 'Total Orders', permission: 'orders:read', icon: OrdersIcon },
  {
    key: 'totalCustomers',
    label: 'Total Customers',
    permission: 'orders:read',
    icon: CustomersIcon,
  },
]

// Revenue has no backing GraphQL field yet — money needs a real Decimal/Money
// scalar (docs/graphql.md § 7), which lands with Billing (M14). Shown as a
// UI-only placeholder gated by the permission that will own it.
export const REVENUE_PLACEHOLDER_CARD = {
  label: 'Total Revenue',
  permission: 'billing:read',
  icon: RevenueIcon,
} as const

interface QuickActionDefinition {
  key: string
  label: string
  href: string
  permission: string
  icon: DashboardIcon
}

export const QUICK_ACTION_DEFINITIONS: readonly QuickActionDefinition[] = [
  {
    key: 'catalog',
    label: 'View Catalog',
    href: ROUTES.CATALOG,
    permission: 'catalog:read',
    icon: ProductsIcon,
  },
  {
    key: 'orders',
    label: 'View Orders',
    href: ROUTES.ORDERS,
    permission: 'orders:read',
    icon: OrdersIcon,
  },
  {
    key: 'billing',
    label: 'View Billing',
    href: ROUTES.BILLING,
    permission: 'billing:read',
    icon: RevenueIcon,
  },
]
