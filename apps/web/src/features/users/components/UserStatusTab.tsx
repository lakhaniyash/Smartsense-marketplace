import { useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  GetUserAuditLogDocument,
  GetUserByIdDocument,
  ReactivateUserDocument,
  SuspendUserDocument,
  UserStatus,
} from '@lib/graphql/__generated__/graphql'
import { Button, Card, CardContent, Dialog, useToast } from '@shared/components'
import { UserStatusBadge } from './UserStatusBadge'

export interface UserStatusTabProps {
  userId: string
  status: UserStatus
  // A caller can never suspend/reactivate their own account (server guardrail,
  // docs/authorization.md § User Role Assignment Guardrails) — the control is
  // disabled-with-reason rather than hidden.
  isSelf: boolean
}

const REFETCH = [GetUserByIdDocument, GetUserAuditLogDocument]

export function UserStatusTab({ userId, status, isSelf }: UserStatusTabProps) {
  const { toast } = useToast()
  const [isConfirmingSuspend, setIsConfirmingSuspend] = useState(false)

  const [suspendUser, { loading: isSuspending }] = useMutation(SuspendUserDocument, {
    refetchQueries: REFETCH,
    onCompleted: () => {
      setIsConfirmingSuspend(false)
      toast({ title: 'User suspended', variant: 'success' })
    },
    onError: (error) =>
      toast({ title: "Couldn't suspend user", description: error.message, variant: 'danger' }),
  })
  const [reactivateUser, { loading: isReactivating }] = useMutation(ReactivateUserDocument, {
    refetchQueries: REFETCH,
    onCompleted: () => toast({ title: 'User reactivated', variant: 'success' }),
    onError: (error) =>
      toast({ title: "Couldn't reactivate user", description: error.message, variant: 'danger' }),
  })

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-fg-muted text-xs font-medium">Current status</span>
          <UserStatusBadge status={status} />
        </div>

        {status === UserStatus.Active && (
          <div className="flex flex-col gap-2">
            <p className="text-fg-secondary text-sm">
              Suspending prevents this user from signing in until they are reactivated.
            </p>
            <Button
              variant="danger"
              disabled={isSelf}
              {...(isSelf && { title: 'You can’t suspend your own account — ask another admin.' })}
              onClick={() => setIsConfirmingSuspend(true)}
            >
              Suspend user
            </Button>
          </div>
        )}

        {status === UserStatus.Suspended && (
          <div className="flex flex-col gap-2">
            <p className="text-fg-secondary text-sm">
              Reactivating restores this user’s ability to sign in.
            </p>
            <Button
              disabled={isSelf}
              isLoading={isReactivating}
              {...(isSelf && {
                title: 'You can’t reactivate your own account — ask another admin.',
              })}
              onClick={() => void reactivateUser({ variables: { id: userId } })}
            >
              Reactivate user
            </Button>
          </div>
        )}

        {status === UserStatus.Invited && (
          <p className="text-fg-secondary text-sm">
            This user has been invited and hasn’t signed in yet. Their status becomes Active on
            first login.
          </p>
        )}

        {status === UserStatus.Deactivated && (
          <p className="text-fg-secondary text-sm">
            This account has been permanently deactivated.
          </p>
        )}
      </CardContent>

      <Dialog
        open={isConfirmingSuspend}
        onOpenChange={setIsConfirmingSuspend}
        title="Suspend this user?"
        description="They will be signed out and unable to sign in again until reactivated."
        confirmLabel="Suspend"
        variant="danger"
        isConfirming={isSuspending}
        onConfirm={() => void suspendUser({ variables: { id: userId } })}
      />
    </Card>
  )
}
