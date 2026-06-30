import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import { PrivateGuard, PublicGuard } from '@app/guards'
import { PrivateLayout, PublicLayout } from '@app/layouts'
import { LoadingPage } from '@app/pages/LoadingPage'
import { ROUTES } from '@shared/constants'

const LoginPage = lazy(() => import('@app/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const UnauthorizedPage = lazy(() =>
  import('@app/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
)
const ForbiddenPage = lazy(() =>
  import('@app/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
)
const NotFoundPage = lazy(() =>
  import('@app/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

const DashboardPage = lazy(() =>
  import('@features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const CatalogPage = lazy(() =>
  import('@features/catalog/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
const OrdersPage = lazy(() =>
  import('@features/orders/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })),
)
const BillingPage = lazy(() =>
  import('@features/billing/pages/BillingPage').then((m) => ({ default: m.BillingPage })),
)

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
  {
    element: <PublicGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
          { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  {
    element: <PrivateGuard />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.CATALOG, element: <CatalogPage /> },
          { path: ROUTES.ORDERS, element: <OrdersPage /> },
          { path: ROUTES.BILLING, element: <BillingPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]
