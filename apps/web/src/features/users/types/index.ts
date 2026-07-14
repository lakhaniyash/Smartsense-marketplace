import type { UserOwnerType, UserStatus } from '@lib/graphql/__generated__/graphql'

// URL-backed filter state for the user list — same pattern as
// CustomerFilters/OrderFilters (docs/frontend-architecture.md § State
// Management Strategy).
export interface UserFilters {
  search?: string | undefined
  status?: UserStatus | undefined
  ownerType?: UserOwnerType | undefined
}
