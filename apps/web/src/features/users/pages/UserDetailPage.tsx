import { useMutation } from '@apollo/client'
import { Link, useParams } from 'react-router'
import { useCurrentUser, usePermissions } from '@features/auth'
import { SendPasswordResetEmailDocument, UserStatus } from '@lib/graphql/__generated__/graphql'
import { Button, ErrorState, PageHeader, Skeleton, Tabs, useToast } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { useBreadcrumb } from '@shared/layouts'
import { UserActivityTab, UserProfileCard, UserRolesTab, UserStatusTab } from '../components'
import { useUser, useUserAuditLog } from '../hooks'

// Sprint 3 (User Management, SM-340). Route-level composition mirroring
// CustomerDetailPage: hooks + view-state branching + Tabs. Editing a user's
// own profile stays in M17 Settings (SM-256) — the Profile tab here is
// view-only by design.
export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoading, error } = useUser(id)
  const {
    entries,
    isLoading: isAuditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useUserAuditLog(id)
  const { user: currentUser } = useCurrentUser()
  const { canManageUsers } = usePermissions()
  const { toast } = useToast()

  useBreadcrumb(user?.fullName)

  const [sendPasswordReset, { loading: isSendingReset }] = useMutation(
    SendPasswordResetEmailDocument,
    {
      onCompleted: () => toast({ title: 'Password reset email sent', variant: 'success' }),
      onError: (resetError) =>
        toast({
          title: "Couldn't send password reset",
          description: resetError.message,
          variant: 'danger',
        }),
    },
  )

  const isSelf = currentUser?.id !== undefined && currentUser.id === user?.id
  const isAdminCaller = currentUser?.roles.includes('Admin') ?? false

  return (
    <div className="flex flex-col gap-6">
      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (error !== undefined || user === undefined) && (
        <ErrorState
          title="Couldn't load user"
          description="This user may not exist, or something went wrong."
          action={
            <Link
              to={ROUTES.USERS}
              className="border-border-default text-fg-default hover:bg-neutral-subtle inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors"
            >
              Back to users
            </Link>
          }
        />
      )}

      {!isLoading && error === undefined && user !== undefined && (
        <>
          <PageHeader
            title={user.fullName}
            description={user.email}
            action={
              canManageUsers &&
              user.status === UserStatus.Active && (
                <Button
                  variant="secondary"
                  isLoading={isSendingReset}
                  onClick={() => void sendPasswordReset({ variables: { id: user.id } })}
                >
                  Send password reset
                </Button>
              )
            }
          />
          <Tabs
            items={[
              {
                value: 'profile',
                label: 'Profile',
                content: (
                  <UserProfileCard
                    email={user.email}
                    ownerType={user.ownerType}
                    partnerId={user.partnerId ?? null}
                    customerId={user.customerId ?? null}
                    createdAt={user.createdAt}
                  />
                ),
              },
              {
                value: 'roles',
                label: 'Roles & Permissions',
                content: (
                  <UserRolesTab
                    userId={user.id}
                    assignedRoles={user.roles}
                    isSelf={isSelf}
                    isAdminCaller={isAdminCaller}
                  />
                ),
              },
              {
                value: 'status',
                label: 'Status',
                content: <UserStatusTab userId={user.id} status={user.status} isSelf={isSelf} />,
              },
              {
                value: 'activity',
                label: 'Activity',
                content: (
                  <UserActivityTab
                    entries={entries}
                    isLoading={isAuditLoading}
                    error={auditError}
                    onRetry={() => void refetchAudit()}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
