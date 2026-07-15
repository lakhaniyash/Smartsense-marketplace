import { Link } from 'react-router'
import { UserOwnerType } from '@lib/graphql/__generated__/graphql'
import { Card, CardContent } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { formatUserOwnerType } from '../utils'

export interface UserProfileCardProps {
  email: string
  ownerType: UserOwnerType
  partnerId: string | null
  customerId: string | null
  createdAt: unknown
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-fg-muted text-xs font-medium">{label}</span>
      <span className="text-fg-default text-sm">{children}</span>
    </div>
  )
}

// The read-only Profile tab. Editing a user's own profile is exclusively M17
// Settings (SM-256) scope — this tab is view-only by design (docs/milestones.md
// boundary), so there is no form here.
export function UserProfileCard({
  email,
  ownerType,
  partnerId,
  customerId,
  createdAt,
}: UserProfileCardProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">{email}</Field>
        <Field label="Owner type">{formatUserOwnerType(ownerType)}</Field>
        {ownerType === UserOwnerType.Customer && customerId !== null && (
          <Field label="Customer">
            <Link
              to={`${ROUTES.CUSTOMERS}/${customerId}`}
              className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
            >
              View customer
            </Link>
          </Field>
        )}
        {ownerType === UserOwnerType.Partner && partnerId !== null && (
          <Field label="Partner">{partnerId}</Field>
        )}
        <Field label="Member since">{new Date(createdAt as string).toLocaleDateString()}</Field>
      </CardContent>
    </Card>
  )
}
