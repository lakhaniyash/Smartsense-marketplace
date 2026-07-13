import { useCurrentUser } from './useCurrentUser'

// The seeded Permission.key vocabulary (database/prisma/seed.ts), mirrored here
// per docs/authentication.md § Permission Strategy: "one permission catalog,
// two consumers." Never hand-check a role name — check a capability key.
const PERMISSION_KEYS = {
  DASHBOARD_VIEW: 'dashboard:view',
  CATALOG_READ: 'catalog:read',
  CATALOG_WRITE: 'catalog:write',
  ORDERS_READ: 'orders:read',
  ORDERS_CREATE: 'orders:create',
  ORDERS_WRITE: 'orders:write',
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  REPORTS_READ: 'reports:read',
  // Sprint 2 (Customer Management, SM-320) — not tied to a
  // docs/milestones.md milestone. See docs/authorization.md § Resource
  // Authorization's Customers row. `customers:manage` (SM-323) is
  // deliberately distinct from `customers:write`: creating a Customer has
  // no Order yet to derive a Partner "permitted" floor from, so it's
  // Admin-only, unlike edit/archive/activate which a Partner may do within
  // their own scope.
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_MANAGE: 'customers:manage',
} as const

export function usePermissions() {
  const { user, isLoading } = useCurrentUser()
  const permissions = user?.permissions ?? []

  function can(key: string): boolean {
    return permissions.includes(key)
  }

  function canAll(keys: string[]): boolean {
    return keys.every((key) => can(key))
  }

  return {
    permissions,
    isLoading,
    can,
    canAll,
    canViewDashboard: can(PERMISSION_KEYS.DASHBOARD_VIEW),
    canReadCatalog: can(PERMISSION_KEYS.CATALOG_READ),
    canEditCatalog: can(PERMISSION_KEYS.CATALOG_WRITE),
    canViewOrders: can(PERMISSION_KEYS.ORDERS_READ),
    canCreateOrders: can(PERMISSION_KEYS.ORDERS_CREATE),
    canEditOrders: can(PERMISSION_KEYS.ORDERS_WRITE),
    canViewBilling: can(PERMISSION_KEYS.BILLING_READ),
    canManageBilling: can(PERMISSION_KEYS.BILLING_MANAGE),
    canViewUsers: can(PERMISSION_KEYS.USERS_READ),
    canManageUsers: can(PERMISSION_KEYS.USERS_MANAGE),
    canViewReports: can(PERMISSION_KEYS.REPORTS_READ),
    canViewCustomers: can(PERMISSION_KEYS.CUSTOMERS_READ),
    canEditCustomers: can(PERMISSION_KEYS.CUSTOMERS_WRITE),
    canCreateCustomers: can(PERMISSION_KEYS.CUSTOMERS_MANAGE),
  }
}
