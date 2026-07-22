import { ProductVariantStatus } from '@lib/graphql/__generated__/graphql'
import { type BadgeVariant, createStatusBadge } from '@shared/components'

const STATUS_VARIANT: Record<ProductVariantStatus, BadgeVariant> = {
  [ProductVariantStatus.Active]: 'success',
  [ProductVariantStatus.OutOfStock]: 'warning',
  [ProductVariantStatus.Discontinued]: 'neutral',
}

const STATUS_LABEL: Record<ProductVariantStatus, string> = {
  [ProductVariantStatus.Active]: 'Active',
  [ProductVariantStatus.OutOfStock]: 'Out of stock',
  [ProductVariantStatus.Discontinued]: 'Discontinued',
}

export interface VariantStatusBadgeProps {
  status: ProductVariantStatus
}

export const VariantStatusBadge = createStatusBadge(STATUS_VARIANT, STATUS_LABEL)
