export const APP_NAME = 'SmartSense Marketplace' as const

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CATALOG: '/catalog',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  BILLING: '/billing',
  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',
  REPORTS_REVENUE: '/reports/revenue',
  REPORTS_ORDERS: '/reports/orders',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_PRODUCT_PERFORMANCE: '/reports/product-performance',
  REPORTS_NOTIFICATION_ACTIVITY: '/reports/notification-activity',
  REPORTS_BILLING_REPORTS: '/reports/billing-reports',
  REPORTS_CUSTOMERS: '/reports/customers',
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
