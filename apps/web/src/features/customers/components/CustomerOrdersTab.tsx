import type { ApolloError } from '@apollo/client'
import { Link } from 'react-router'
import type { GetCustomerOrdersQuery, PageInfo } from '@lib/graphql/__generated__/graphql'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components'
import { ROUTES } from '@shared/constants'

type CustomerOrder = GetCustomerOrdersQuery['orders']['edges'][number]['node']

export interface CustomerOrdersTabProps {
  orders: CustomerOrder[]
  pageInfo: PageInfo | undefined
  isLoading: boolean
  error: ApolloError | undefined
  onRetry: () => void
  hasPreviousPage: boolean
  onNext: () => void
  onPrevious: () => void
}

// The Orders tab on the Customer detail page — a bounded, paginated preview
// backed by useCustomerOrders. Owns all four view states itself so
// CustomerDetailPage stays pure composition (docs/frontend-architecture.md
// § Feature Module Architecture).
export function CustomerOrdersTab({
  orders,
  pageInfo,
  isLoading,
  error,
  onRetry,
  hasPreviousPage,
  onNext,
  onPrevious,
}: CustomerOrdersTabProps) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />
  }

  if (error !== undefined) {
    return (
      <ErrorState
        title="Couldn't load orders"
        description="Something went wrong while loading this customer's orders."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders placed by this customer will show up here."
      />
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="md:text-right">Total</TableHead>
              <TableHead>Placed</TableHead>
            </TableRow>
          </TableHeader>
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
                <TableCell label="Status">{order.status}</TableCell>
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
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </CardContent>
    </Card>
  )
}
