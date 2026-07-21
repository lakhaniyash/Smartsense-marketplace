import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { type BadgeVariant, createStatusBadge } from '@shared/components'

const STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  [ProductStatus.Draft]: 'neutral',
  [ProductStatus.PendingReview]: 'warning',
  [ProductStatus.Published]: 'success',
  [ProductStatus.Archived]: 'neutral',
}

const STATUS_LABEL: Record<ProductStatus, string> = {
  [ProductStatus.Draft]: 'Draft',
  [ProductStatus.PendingReview]: 'Pending review',
  [ProductStatus.Published]: 'Published',
  [ProductStatus.Archived]: 'Archived',
}

export interface ProductStatusBadgeProps {
  status: ProductStatus
}

export const ProductStatusBadge = createStatusBadge(STATUS_VARIANT, STATUS_LABEL)
