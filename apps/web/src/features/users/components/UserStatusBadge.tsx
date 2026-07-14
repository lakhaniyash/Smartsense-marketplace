import { UserStatus } from '@lib/graphql/__generated__/graphql'
import { Badge, type BadgeVariant } from '@shared/components'

const STATUS_VARIANT: Record<UserStatus, BadgeVariant> = {
  [UserStatus.Active]: 'success',
  [UserStatus.Invited]: 'info',
  [UserStatus.Suspended]: 'warning',
  [UserStatus.Deactivated]: 'neutral',
}

const STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.Active]: 'Active',
  [UserStatus.Invited]: 'Invited',
  [UserStatus.Suspended]: 'Suspended',
  [UserStatus.Deactivated]: 'Deactivated',
}

export interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
