import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  Button,
  Card,
  CardContent,
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
        <TableHead className="md:text-right">Total</TableHead>
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
              className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Create Order
            </Link>
          )
        }
      />
      <Card>
        <CardContent className="p-4">
          <OrderFilterBar
            status={filters.status}
            onStatusChange={(value) => setFilter('status', value)}
          />
        </CardContent>
      </Card>

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

      {!isLoading && error === undefined && orders.length === 0 && filters.status !== undefined && (
        <EmptyState
          title="No orders match this filter"
          description="Try a different status, or clear the filter to see all orders."
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilter('status', undefined)}>
              Clear filter
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && orders.length === 0 && filters.status === undefined && (
        <EmptyState
          title="No orders yet"
          description="Orders you place or receive will show up here."
          action={
            canCreateOrders && (
              <Link
                to={`${ROUTES.ORDERS}/new`}
                className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Create Order
              </Link>
            )
          }
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
                      className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell label="Status">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell label="Total" className="md:text-right">
                    ${order.total}
                  </TableCell>
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
