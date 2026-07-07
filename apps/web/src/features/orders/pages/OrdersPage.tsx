import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { OrderFilterBar, OrderStatusBadge } from '../components'
import { useOrders } from '../hooks'

const COLUMN_COUNT = 4

function OrderTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Order #</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Placed</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// The Order list — M13 (docs/milestones.md). Route-level composition only:
// calls the feature's hook, branches the four view states, arranges
// components (docs/frontend-architecture.md § Feature Module Architecture).
export function OrdersPage() {
  const {
    orders,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    hasPreviousPage,
    refetch,
  } = useOrders()
  const { canCreateOrders } = usePermissions()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Orders placed on the marketplace."
        action={
          canCreateOrders && (
            <Link
              to={`${ROUTES.ORDERS}/new`}
              className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              Create Order
            </Link>
          )
        }
      />
      <OrderFilterBar
        status={filters.status}
        onStatusChange={(value) => setFilter('status', value)}
      />

      {isLoading && (
        <Table>
          <OrderTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load orders"
          description="Something went wrong while loading your orders."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && orders.length === 0 && (
        <EmptyState
          title="No orders yet"
          description="Orders you place or receive will show up here."
        />
      )}

      {!isLoading && error === undefined && orders.length > 0 && (
        <>
          <Table>
            <OrderTableHead />
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell label="Order #">
                    <Link
                      to={`${ROUTES.ORDERS}/${order.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell label="Status">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell label="Total">${order.total}</TableCell>
                  <TableCell label="Placed">
                    {order.placedAt !== null && order.placedAt !== undefined
                      ? new Date(order.placedAt as string).toLocaleDateString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={pageInfo?.hasNextPage ?? false}
            onPrevious={() => window.history.back()}
            onNext={goToNextPage}
          />
        </>
      )}
    </div>
  )
}
