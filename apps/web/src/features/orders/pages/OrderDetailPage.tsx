import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  CancelOrderDocument,
  GetOrderByIdDocument,
  OrderStatus,
  UpdateOrderStatusDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { OrderStatusBadge, OrderTimeline } from '../components'
import { useOrder } from '../hooks'

// Nested more than one level under /orders, so it gets a Breadcrumb per
// docs/ui-guidelines.md § Navigation — same pattern as ProductDetailPage.
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { order, isLoading, error } = useOrder(id)
  const { canCreateOrders, canEditOrders } = usePermissions()
  const { toast } = useToast()
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  const [updateOrderStatus, { loading: isUpdatingStatus }] = useMutation(
    UpdateOrderStatusDocument,
    {
      refetchQueries: [GetOrderByIdDocument],
      onCompleted: () => toast({ title: 'Order status updated', variant: 'success' }),
      onError: (mutationError) => {
        toast({
          title: "Couldn't update order status",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  const [cancelOrder, { loading: isCancelling }] = useMutation(CancelOrderDocument, {
    refetchQueries: [GetOrderByIdDocument],
    onCompleted: () => {
      setIsConfirmingCancel(false)
      toast({ title: 'Order cancelled', variant: 'success' })
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't cancel order",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  // Ownership is already enforced by the `order` query's server-side scoping
  // (a Partner/Customer can only ever fetch their own order) — the
  // remaining client-side gate is just the row-specific permission
  // (docs/authorization.md § Orders) and the order's current status.
  const canConfirm = order?.status === OrderStatus.Draft && canCreateOrders
  const canStartProcessing = order?.status === OrderStatus.Confirmed && canEditOrders
  const canCancel =
    order !== undefined &&
    ((order.status === OrderStatus.Draft || order.status === OrderStatus.Confirmed) &&
    canCreateOrders
      ? true
      : order.status === OrderStatus.Processing && canEditOrders)

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Orders', href: ROUTES.ORDERS },
          { label: order !== undefined ? `Order #${order.orderNumber}` : 'Order' },
        ]}
      />

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && (error !== undefined || order === undefined) && (
        <ErrorState
          title="Couldn't load this order"
          description="It may not exist, or you may not have access to it."
          action={
            <Button variant="secondary" onClick={() => window.history.back()}>
              Back to orders
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && order !== undefined && (
        <>
          <PageHeader
            title={`Order #${order.orderNumber}`}
            description={`Placed ${order.placedAt !== null && order.placedAt !== undefined ? new Date(order.placedAt as string).toLocaleString() : '—'}`}
            action={
              <div className="flex gap-2">
                {canConfirm && (
                  <Button
                    isLoading={isUpdatingStatus}
                    onClick={() =>
                      void updateOrderStatus({
                        variables: { id: order.id, status: OrderStatus.Confirmed },
                      })
                    }
                  >
                    Confirm
                  </Button>
                )}
                {canStartProcessing && (
                  <Button
                    isLoading={isUpdatingStatus}
                    onClick={() =>
                      void updateOrderStatus({
                        variables: { id: order.id, status: OrderStatus.Processing },
                      })
                    }
                  >
                    Start Processing
                  </Button>
                )}
                {canCancel && (
                  <Button variant="danger" onClick={() => setIsConfirmingCancel(true)}>
                    Cancel
                  </Button>
                )}
              </div>
            }
          />
          <Tabs
            items={[
              {
                value: 'details',
                label: 'Details',
                content: (
                  <Card>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-sm text-gray-500">Total: ${order.total}</span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Line Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell label="SKU">{item.productVariant.sku}</TableCell>
                              <TableCell label="Quantity">{item.quantity}</TableCell>
                              <TableCell label="Unit Price">${item.unitPriceSnapshot}</TableCell>
                              <TableCell label="Line Total">${item.lineTotal}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <span>Subtotal: ${order.subtotal}</span>
                        <span>Tax: ${order.tax}</span>
                        <span>Shipping: ${order.shippingCost}</span>
                        <span className="font-medium">Total: ${order.total}</span>
                      </div>
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'timeline',
                label: 'Timeline',
                content: <OrderTimeline entries={order.statusHistory} />,
              },
            ]}
          />

          <Dialog
            open={isConfirmingCancel}
            onOpenChange={setIsConfirmingCancel}
            title="Cancel this order?"
            description={`Order #${order.orderNumber} will be cancelled${order.status !== OrderStatus.Draft ? ' and any reserved stock released' : ''}. This cannot be undone.`}
            confirmLabel="Cancel order"
            variant="danger"
            isConfirming={isCancelling}
            onConfirm={() => void cancelOrder({ variables: { id: order.id, reason: null } })}
          />
        </>
      )}
    </div>
  )
}
