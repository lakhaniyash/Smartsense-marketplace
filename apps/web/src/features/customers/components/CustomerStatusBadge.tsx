import { CustomerStatus } from '@lib/graphql/__generated__/graphql'
import { type BadgeVariant, createStatusBadge } from '@shared/components'

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

export const CustomerStatusBadge = createStatusBadge(STATUS_VARIANT, STATUS_LABEL)
