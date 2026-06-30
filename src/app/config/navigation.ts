import { ROUTES } from '@shared/constants'

export interface NavItem {
  readonly label: string
  readonly path: string
  readonly iconKey: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, iconKey: 'dashboard' },
  { label: 'Catalog', path: ROUTES.CATALOG, iconKey: 'catalog' },
  { label: 'Orders', path: ROUTES.ORDERS, iconKey: 'orders' },
  { label: 'Billing', path: ROUTES.BILLING, iconKey: 'billing' },
]
