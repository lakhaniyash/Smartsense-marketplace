import { useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  AssignUserRoleDocument,
  GetUserAuditLogDocument,
  GetUserByIdDocument,
  RemoveUserRoleDocument,
} from '@lib/graphql/__generated__/graphql'
import { Badge, Button, Card, CardContent, EmptyState, useToast } from '@shared/components'
import { useRoles } from '../hooks'

interface RolePermission {
  id: string
  key: string
}

interface RoleSummary {
  id: string
  name: string
  description?: string | null
  isSystemRole: boolean
  permissions: RolePermission[]
}

export interface UserRolesTabProps {
  userId: string
  assignedRoles: RoleSummary[]
  // A caller can never change their own role grants (server guardrail).
  isSelf: boolean
  // Granting the Admin role requires the caller to already hold it — known
  // client-side, so it's disabled-with-reason. The last-Admin-standing guard
  // can't be evaluated client-side and is surfaced via the server error toast.
  isAdminCaller: boolean
}

const REFETCH = [GetUserByIdDocument, GetUserAuditLogDocument]

export function UserRolesTab({ userId, assignedRoles, isSelf, isAdminCaller }: UserRolesTabProps) {
  const { toast } = useToast()
  const { roles, isLoading } = useRoles()
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)

  const onError = (verb: string) => (error: { message: string }) =>
    toast({ title: `Couldn't ${verb} role`, description: error.message, variant: 'danger' })

  const [assignUserRole, { loading: isAssigning }] = useMutation(AssignUserRoleDocument, {
    refetchQueries: REFETCH,
    onCompleted: () => toast({ title: 'Role assigned', variant: 'success' }),
    onError: onError('assign'),
  })
  const [removeUserRole, { loading: isRemoving }] = useMutation(RemoveUserRoleDocument, {
    refetchQueries: REFETCH,
    onCompleted: () => toast({ title: 'Role removed', variant: 'success' }),
    onError: onError('remove'),
  })

  const assignedIds = new Set(assignedRoles.map((role) => role.id))
  const availableRoles = roles.filter((role) => !assignedIds.has(role.id))

  const selfReason = 'You can’t change your own roles — ask another admin.'

  function handleAssign(roleId: string) {
    setActiveRoleId(roleId)
    void assignUserRole({ variables: { userId, roleId } })
  }
  function handleRemove(roleId: string) {
    setActiveRoleId(roleId)
    void removeUserRole({ variables: { userId, roleId } })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-default text-sm font-semibold">Assigned roles</h3>
        {assignedRoles.length === 0 ? (
          <EmptyState title="No roles assigned" description="Assign a role from the list below." />
        ) : (
          <div className="flex flex-col gap-3">
            {assignedRoles.map((role) => (
              <Card key={role.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-fg-default font-medium">{role.name}</span>
                        {role.isSystemRole && <Badge variant="neutral">System</Badge>}
                      </div>
                      {role.description != null && role.description !== '' && (
                        <span className="text-fg-muted text-sm">{role.description}</span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isSelf}
                      isLoading={isRemoving && activeRoleId === role.id}
                      {...(isSelf && { title: selfReason })}
                      onClick={() => handleRemove(role.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  {role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((permission) => (
                        <Badge key={permission.id} variant="info">
                          {permission.key}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-fg-default text-sm font-semibold">Available roles</h3>
        {isLoading ? (
          <p className="text-fg-muted text-sm">Loading roles…</p>
        ) : availableRoles.length === 0 ? (
          <p className="text-fg-muted text-sm">This user already holds every assignable role.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableRoles.map((role) => {
              const adminBlocked = role.name === 'Admin' && !isAdminCaller
              const disabled = isSelf || adminBlocked
              const reason = isSelf
                ? selfReason
                : adminBlocked
                  ? 'Only an existing admin can grant the Admin role.'
                  : undefined
              return (
                <div
                  key={role.id}
                  className="border-border-default flex items-center justify-between gap-4 rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-fg-default text-sm font-medium">{role.name}</span>
                    {role.isSystemRole && <Badge variant="neutral">System</Badge>}
                  </div>
                  <Button
                    size="sm"
                    disabled={disabled}
                    isLoading={isAssigning && activeRoleId === role.id}
                    {...(reason !== undefined && { title: reason })}
                    onClick={() => handleAssign(role.id)}
                  >
                    Assign
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
