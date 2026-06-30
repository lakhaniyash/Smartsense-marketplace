import { ROUTES } from '@shared/constants'

export interface BreadcrumbItem {
  readonly label: string
  readonly path?: string
}

export const BREADCRUMBS: Readonly<Record<string, readonly BreadcrumbItem[]>> = {
  [ROUTES.DASHBOARD]: [{ label: 'Dashboard' }],
  [ROUTES.CATALOG]: [{ label: 'Catalog' }],
  [ROUTES.ORDERS]: [{ label: 'Orders' }],
  [ROUTES.BILLING]: [{ label: 'Billing' }],
}
