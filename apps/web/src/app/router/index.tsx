import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { ProtectedRoute, PermissionRoute, PublicRoute } from '@app/guards'
import { AuthenticatedLayout, PublicLayout } from '@app/layouts'
import { AppLoadingState } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { NotFoundPage } from './NotFoundPage'

const LoginPage = lazy(() => import('@features/auth').then((m) => ({ default: m.LoginPage })))
const UnauthorizedPage = lazy(() =>
  import('@features/auth').then((m) => ({ default: m.UnauthorizedPage })),
)
const ForbiddenPage = lazy(() =>
  import('@features/auth').then((m) => ({ default: m.ForbiddenPage })),
)
const DashboardPage = lazy(() =>
  import('@features/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const CatalogPage = lazy(() =>
  import('@features/catalog').then((m) => ({ default: m.CatalogPage })),
)
const ProductDetailPage = lazy(() =>
  import('@features/catalog').then((m) => ({ default: m.ProductDetailPage })),
)
const ProductFormPage = lazy(() =>
  import('@features/catalog').then((m) => ({ default: m.ProductFormPage })),
)
const OrdersPage = lazy(() => import('@features/orders').then((m) => ({ default: m.OrdersPage })))
const OrderDetailPage = lazy(() =>
  import('@features/orders').then((m) => ({ default: m.OrderDetailPage })),
)
const OrderFormPage = lazy(() =>
  import('@features/orders').then((m) => ({ default: m.OrderFormPage })),
)
const CustomersPage = lazy(() =>
  import('@features/customers').then((m) => ({ default: m.CustomersPage })),
)
const CustomerDetailPage = lazy(() =>
  import('@features/customers').then((m) => ({ default: m.CustomerDetailPage })),
)
const CustomerFormPage = lazy(() =>
  import('@features/customers').then((m) => ({ default: m.CustomerFormPage })),
)
const BillingPage = lazy(() =>
  import('@features/billing').then((m) => ({ default: m.BillingPage })),
)
const InvoiceDetailPage = lazy(() =>
  import('@features/billing').then((m) => ({ default: m.InvoiceDetailPage })),
)
const NotificationsPage = lazy(() =>
  import('@features/notifications').then((m) => ({ default: m.NotificationsPage })),
)
const ReportsDashboardPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.ReportsDashboardPage })),
)
const RevenueReportPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.RevenueReportPage })),
)
const OrdersReportPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.OrdersReportPage })),
)
const InventoryReportPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.InventoryReportPage })),
)
const ProductPerformanceReportPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.ProductPerformanceReportPage })),
)
const NotificationActivityReportPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.NotificationActivityReportPage })),
)
const BillingReportsPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.BillingReportsPage })),
)
const BillingReportDetailPage = lazy(() =>
  import('@features/reports').then((m) => ({ default: m.BillingReportDetailPage })),
)

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<AppLoadingState />}>{element}</Suspense>
}

// Path strings live once here, sourced from shared/constants (per
// docs/frontend-architecture.md § Routing Architecture); permission keys
// match docs/authorization.md's seeded catalog exactly.
const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [{ path: ROUTES.LOGIN.slice(1), element: withSuspense(<LoginPage />) }],
      },
      {
        path: ROUTES.UNAUTHORIZED.slice(1),
        element: withSuspense(<UnauthorizedPage />),
      },
      {
        path: ROUTES.FORBIDDEN.slice(1),
        element: withSuspense(<ForbiddenPage />),
      },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      {
        element: <AuthenticatedLayout />,
        children: [
          {
            element: <PermissionRoute permission="dashboard:view" />,
            children: [
              { path: ROUTES.DASHBOARD.slice(1), element: withSuspense(<DashboardPage />) },
            ],
          },
          {
            element: <PermissionRoute permission="catalog:read" />,
            children: [
              { path: ROUTES.CATALOG.slice(1), element: withSuspense(<CatalogPage />) },
              {
                path: `${ROUTES.CATALOG.slice(1)}/:id`,
                element: withSuspense(<ProductDetailPage />),
                handle: {
                  crumb: [{ label: 'Catalog', href: ROUTES.CATALOG }, { label: 'Product' }],
                },
              },
            ],
          },
          {
            element: <PermissionRoute permission="catalog:write" />,
            children: [
              {
                path: `${ROUTES.CATALOG.slice(1)}/new`,
                element: withSuspense(<ProductFormPage />),
                handle: {
                  crumb: [{ label: 'Catalog', href: ROUTES.CATALOG }, { label: 'New product' }],
                },
              },
              {
                path: `${ROUTES.CATALOG.slice(1)}/:id/edit`,
                element: withSuspense(<ProductFormPage />),
                handle: {
                  crumb: [{ label: 'Catalog', href: ROUTES.CATALOG }, { label: 'Edit product' }],
                },
              },
            ],
          },
          {
            element: <PermissionRoute permission="orders:read" />,
            children: [
              { path: ROUTES.ORDERS.slice(1), element: withSuspense(<OrdersPage />) },
              {
                path: `${ROUTES.ORDERS.slice(1)}/:id`,
                element: withSuspense(<OrderDetailPage />),
                handle: { crumb: [{ label: 'Orders', href: ROUTES.ORDERS }, { label: 'Order' }] },
              },
            ],
          },
          {
            element: <PermissionRoute permission="orders:create" />,
            children: [
              {
                path: `${ROUTES.ORDERS.slice(1)}/new`,
                element: withSuspense(<OrderFormPage />),
                handle: {
                  crumb: [{ label: 'Orders', href: ROUTES.ORDERS }, { label: 'New order' }],
                },
              },
            ],
          },
          // Sprint 2 (Customer Management, SM-320/SM-322/SM-323) — not tied
          // to a docs/milestones.md milestone. Same list/detail split as
          // Catalog/Orders above, but create and edit sit behind two
          // different keys (customers:manage vs customers:write) rather
          // than one — creating a Customer is Admin-only, editing one a
          // Partner may also do within their own scope.
          {
            element: <PermissionRoute permission="customers:read" />,
            children: [
              { path: ROUTES.CUSTOMERS.slice(1), element: withSuspense(<CustomersPage />) },
              {
                path: `${ROUTES.CUSTOMERS.slice(1)}/:id`,
                element: withSuspense(<CustomerDetailPage />),
                handle: {
                  crumb: [{ label: 'Customers', href: ROUTES.CUSTOMERS }, { label: 'Customer' }],
                },
              },
            ],
          },
          {
            element: <PermissionRoute permission="customers:manage" />,
            children: [
              {
                path: `${ROUTES.CUSTOMERS.slice(1)}/new`,
                element: withSuspense(<CustomerFormPage />),
                handle: {
                  crumb: [
                    { label: 'Customers', href: ROUTES.CUSTOMERS },
                    { label: 'New customer' },
                  ],
                },
              },
            ],
          },
          {
            element: <PermissionRoute permission="customers:write" />,
            children: [
              {
                path: `${ROUTES.CUSTOMERS.slice(1)}/:id/edit`,
                element: withSuspense(<CustomerFormPage />),
                handle: {
                  crumb: [
                    { label: 'Customers', href: ROUTES.CUSTOMERS },
                    { label: 'Edit customer' },
                  ],
                },
              },
            ],
          },
          {
            element: <PermissionRoute permission="billing:read" />,
            children: [
              { path: ROUTES.BILLING.slice(1), element: withSuspense(<BillingPage />) },
              {
                path: `${ROUTES.BILLING.slice(1)}/:id`,
                element: withSuspense(<InvoiceDetailPage />),
                handle: {
                  crumb: [{ label: 'Billing', href: ROUTES.BILLING }, { label: 'Invoice' }],
                },
              },
            ],
          },
          // No PermissionRoute wrapper: a Notification is inherently a
          // personal resource (recipientId === user.id), never a role-scoped
          // "someone else's data" concern the way Catalog/Orders/Billing are —
          // plain authentication is the correct and only gate here (matches
          // the backend's deliberate absence of a notifications:* permission
          // key, docs/authorization.md).
          {
            path: ROUTES.NOTIFICATIONS.slice(1),
            element: withSuspense(<NotificationsPage />),
            handle: { crumb: [{ label: 'Notifications' }] },
          },
          // Every report route shares one `reports:read` permission — it
          // covers view *and* generate/finalize/mark-paid-out for every
          // report type (M15 plan § Architectural Decisions) — six distinct
          // data domains, each its own bookmarkable route, not tabs
          // (docs/frontend-architecture.md § Routing Architecture).
          {
            element: <PermissionRoute permission="reports:read" />,
            children: [
              // No `handle.crumb` on any of these 6 — each is the direct,
              // one-level-deep entry point for its report (reached straight
              // from the Reports nav/dashboard link grid), the same
              // relationship Catalog/Orders/Billing's own list pages have to
              // their sidebar entry, and those get no breadcrumb either
              // (Breadcrumbs.tsx's own comment: "omitted on top-level list
              // pages"). A `handle.crumb` here previously added a real
              // "Reports > X" bar above the page inside `Content`'s bounded
              // `main` — which the page's own `h-full` flex column doesn't
              // reserve room for — so the box overflowed `main` by exactly
              // the crumb's height and Pagination/the KPI body sat just below
              // the fold instead of fitting flush, unlike Catalog. Only the
              // true nested detail page below keeps its crumb.
              { path: ROUTES.REPORTS.slice(1), element: withSuspense(<ReportsDashboardPage />) },
              {
                path: ROUTES.REPORTS_REVENUE.slice(1),
                element: withSuspense(<RevenueReportPage />),
              },
              {
                path: ROUTES.REPORTS_ORDERS.slice(1),
                element: withSuspense(<OrdersReportPage />),
              },
              {
                path: ROUTES.REPORTS_INVENTORY.slice(1),
                element: withSuspense(<InventoryReportPage />),
              },
              {
                path: ROUTES.REPORTS_PRODUCT_PERFORMANCE.slice(1),
                element: withSuspense(<ProductPerformanceReportPage />),
              },
              {
                path: ROUTES.REPORTS_NOTIFICATION_ACTIVITY.slice(1),
                element: withSuspense(<NotificationActivityReportPage />),
              },
              {
                path: ROUTES.REPORTS_BILLING_REPORTS.slice(1),
                element: withSuspense(<BillingReportsPage />),
              },
              {
                path: `${ROUTES.REPORTS_BILLING_REPORTS.slice(1)}/:id`,
                element: withSuspense(<BillingReportDetailPage />),
                handle: {
                  crumb: [
                    { label: 'Reports', href: ROUTES.REPORTS },
                    { label: 'Billing Reports', href: ROUTES.REPORTS_BILLING_REPORTS },
                    { label: 'Billing Report' },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
