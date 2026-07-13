import { CustomerStatus } from '@lib/graphql/__generated__/graphql'
import { Badge, type BadgeVariant } from '@shared/components'

const STATUS_VARIANT: Record<CustomerStatus, BadgeVariant> = {
  [CustomerStatus.Active]: 'success',
  [CustomerStatus.Suspended]: 'warning',
}

const STATUS_LABEL: Record<CustomerStatus, string> = {
  [CustomerStatus.Active]: 'Active',
  [CustomerStatus.Suspended]: 'Suspended',
}

export interface CustomerStatusBadgeProps {
  status: CustomerStatus
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
