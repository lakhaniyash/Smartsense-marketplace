import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { Badge, type BadgeVariant } from '@shared/components'

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

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
