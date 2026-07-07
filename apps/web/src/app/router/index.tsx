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
const BillingPage = lazy(() =>
  import('@features/billing').then((m) => ({ default: m.BillingPage })),
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
              },
            ],
          },
          {
            element: <PermissionRoute permission="catalog:write" />,
            children: [
              {
                path: `${ROUTES.CATALOG.slice(1)}/new`,
                element: withSuspense(<ProductFormPage />),
              },
              {
                path: `${ROUTES.CATALOG.slice(1)}/:id/edit`,
                element: withSuspense(<ProductFormPage />),
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
              },
            ],
          },
          {
            element: <PermissionRoute permission="orders:create" />,
            children: [
              {
                path: `${ROUTES.ORDERS.slice(1)}/new`,
                element: withSuspense(<OrderFormPage />),
              },
            ],
          },
          {
            element: <PermissionRoute permission="billing:read" />,
            children: [{ path: ROUTES.BILLING.slice(1), element: withSuspense(<BillingPage />) }],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
