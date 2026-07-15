import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ArchiveRoleDocument, GetRolesDocument } from '@lib/graphql/__generated__/graphql'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  useToast,
} from '@shared/components'
import { RoleFormDrawer, type EditableRole, type PermissionOption } from '../components'
import { useRoles } from '../hooks'

const COLUMN_COUNT = 5
const SYSTEM_ROLE_REASON = 'System roles can’t be edited or archived.'

function RolesTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Permissions</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// Sprint 3 (User Management, SM-340). Admin sub-page for custom Role CRUD —
// system roles (Admin/Partner/Customer) show their controls disabled-with-
// reason rather than hidden (ui-guidelines.md), since the backend rejects
// editing/archiving them.
export function RolesPage() {
  const { roles, isLoading, error, refetch } = useRoles()
  const { toast } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null)
  const [archivingRole, setArchivingRole] = useState<{ id: string; name: string } | null>(null)

  const [archiveRole, { loading: isArchiving }] = useMutation(ArchiveRoleDocument, {
    refetchQueries: [GetRolesDocument],
    onCompleted: () => {
      setArchivingRole(null)
      toast({ title: 'Role archived', variant: 'success' })
    },
    onError: (archiveError) =>
      toast({
        title: "Couldn't archive role",
        description: archiveError.message,
        variant: 'danger',
      }),
  })

  // Admin holds every seeded permission, so the union across roles is the full
  // catalog (there is no dedicated permissions query — see SM-340 notes).
  const allPermissions: PermissionOption[] = [
    ...new Map(roles.flatMap((role) => role.permissions).map((p) => [p.key, p])).values(),
  ]

  function openCreate() {
    setEditingRole(null)
    setDrawerOpen(true)
  }
  function openEdit(role: EditableRole) {
    setEditingRole(role)
    setDrawerOpen(true)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Roles"
        description="Custom roles and the permissions they grant."
        action={<Button onClick={openCreate}>Create role</Button>}
      />

      {isLoading && (
        <Table>
          <RolesTableHead />
          <TableSkeleton rows={4} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load roles"
          description="Something went wrong while loading roles."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && roles.length === 0 && (
        <EmptyState title="No roles yet" description="Create a custom role to get started." />
      )}

      {!isLoading && error === undefined && roles.length > 0 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <RolesTableHead />
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell label="Name">
                      <span className="text-fg-default font-medium">{role.name}</span>
                    </TableCell>
                    <TableCell label="Description">{role.description ?? '—'}</TableCell>
                    <TableCell label="Type">
                      <Badge variant={role.isSystemRole ? 'neutral' : 'info'}>
                        {role.isSystemRole ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell label="Permissions">{role.permissions.length}</TableCell>
                    <TableCell label="Actions">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={role.isSystemRole}
                          {...(role.isSystemRole && { title: SYSTEM_ROLE_REASON })}
                          onClick={() => openEdit(role)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={role.isSystemRole}
                          {...(role.isSystemRole && { title: SYSTEM_ROLE_REASON })}
                          onClick={() => setArchivingRole({ id: role.id, name: role.name })}
                        >
                          Archive
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <RoleFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        role={editingRole}
        allPermissions={allPermissions}
      />

      <Dialog
        open={archivingRole !== null}
        onOpenChange={(open) => {
          if (!open) setArchivingRole(null)
        }}
        title={archivingRole !== null ? `Archive ${archivingRole.name}?` : 'Archive role?'}
        description="Archiving prevents the role from being assigned to new users. Users who already have it keep it."
        confirmLabel="Archive"
        variant="danger"
        isConfirming={isArchiving}
        onConfirm={() => {
          if (archivingRole !== null) void archiveRole({ variables: { id: archivingRole.id } })
        }}
      />
    </div>
  )
}
