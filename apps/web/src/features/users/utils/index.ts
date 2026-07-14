import { UserOwnerType } from '@lib/graphql/__generated__/graphql'

const OWNER_TYPE_LABEL: Record<UserOwnerType, string> = {
  [UserOwnerType.None]: 'Platform',
  [UserOwnerType.Partner]: 'Partner',
  [UserOwnerType.Customer]: 'Customer',
}

// A NONE-owner user is platform staff (Admin), not attached to any Partner or
// Customer organization (docs/domain-model.md § User) — rendered "Platform"
// rather than the raw enum value.
export function formatUserOwnerType(ownerType: UserOwnerType): string {
  return OWNER_TYPE_LABEL[ownerType]
}
