import { OrderStatus } from '@lib/graphql/__generated__/graphql'
import { type BadgeVariant, createStatusBadge } from '@shared/components'

// Covers every OrderStatus value, not just the four M13 drives — the schema
// exposes the full docs/domain-model.md § Order Lifecycle enum today even
// though only DRAFT/CONFIRMED/PROCESSING/CANCELLED are reachable yet.
const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  [OrderStatus.Draft]: 'neutral',
  [OrderStatus.PendingPayment]: 'warning',
  [OrderStatus.Confirmed]: 'info',
  [OrderStatus.Processing]: 'info',
  [OrderStatus.Shipped]: 'info',
  [OrderStatus.Delivered]: 'success',
  [OrderStatus.ReturnRequested]: 'warning',
  [OrderStatus.Completed]: 'success',
  [OrderStatus.Cancelled]: 'danger',
  [OrderStatus.Refunded]: 'neutral',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: 'Draft',
  [OrderStatus.PendingPayment]: 'Pending payment',
  [OrderStatus.Confirmed]: 'Confirmed',
  [OrderStatus.Processing]: 'Processing',
  [OrderStatus.Shipped]: 'Shipped',
  [OrderStatus.Delivered]: 'Delivered',
  [OrderStatus.ReturnRequested]: 'Return requested',
  [OrderStatus.Completed]: 'Completed',
  [OrderStatus.Cancelled]: 'Cancelled',
  [OrderStatus.Refunded]: 'Refunded',
}

export interface OrderStatusBadgeProps {
  status: OrderStatus
}

export const OrderStatusBadge = createStatusBadge(STATUS_VARIANT, STATUS_LABEL)
