export const APP_NAME = 'SmartSense Marketplace' as const

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CATALOG: '/catalog',
  ORDERS: '/orders',
  BILLING: '/billing',
  UNAUTHORIZED: '/unauthorized',
  FORBIDDEN: '/forbidden',
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  PARTNER: 'partner',
  CUSTOMER: 'customer',
} as const

export const DEFAULT_PAGE_SIZE = 20 as const

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
