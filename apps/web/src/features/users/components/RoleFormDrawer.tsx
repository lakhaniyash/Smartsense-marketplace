import { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  CreateRoleDocument,
  GetRolesDocument,
  UpdateRolePermissionsDocument,
} from '@lib/graphql/__generated__/graphql'
import { Button, Checkbox, Drawer, Input, Textarea, useToast } from '@shared/components'

export interface PermissionOption {
  id: string
  key: string
  domain: string
  description?: string | null
}

export interface EditableRole {
  id: string
  name: string
  description?: string | null
  permissions: Array<{ key: string }>
}

export interface RoleFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // null → create a new custom role; a role → edit its permission set only
  // (the backend has no rename mutation, so name/description are read-only in
  // edit mode).
  role: EditableRole | null
  allPermissions: PermissionOption[]
}

function groupByDomain(permissions: PermissionOption[]): Array<[string, PermissionOption[]]> {
  const map = new Map<string, PermissionOption[]>()
  for (const permission of permissions) {
    const list = map.get(permission.domain) ?? []
    list.push(permission)
    map.set(permission.domain, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function RoleFormDrawer({ open, onOpenChange, role, allPermissions }: RoleFormDrawerProps) {
  const { toast } = useToast()
  const isEdit = role !== null
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | undefined>(undefined)

  // Re-seed the form whenever it opens (or the target role changes) so a
  // reused drawer never shows the previous role's values.
  useEffect(() => {
    if (!open) return
    setName(role?.name ?? '')
    setDescription(role?.description ?? '')
    setSelectedKeys(new Set(role?.permissions.map((permission) => permission.key) ?? []))
    setError(undefined)
  }, [open, role])

  const onError = (error: { message: string }) =>
    toast({ title: "Couldn't save role", description: error.message, variant: 'danger' })
  const onCompleted = (title: string) => () => {
    toast({ title, variant: 'success' })
    onOpenChange(false)
  }

  const [createRole, { loading: isCreating }] = useMutation(CreateRoleDocument, {
    refetchQueries: [GetRolesDocument],
    onCompleted: onCompleted('Role created'),
    onError,
  })
  const [updateRolePermissions, { loading: isUpdating }] = useMutation(
    UpdateRolePermissionsDocument,
    { refetchQueries: [GetRolesDocument], onCompleted: onCompleted('Role updated'), onError },
  )

  function toggleKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setError(undefined)
  }

  function handleSubmit() {
    const permissionKeys = [...selectedKeys]
    if (!isEdit && name.trim() === '') {
      setError('Role name is required')
      return
    }
    if (permissionKeys.length === 0) {
      setError('Select at least one permission')
      return
    }
    if (isEdit) {
      void updateRolePermissions({ variables: { input: { id: role.id, permissionKeys } } })
    } else {
      void createRole({
        variables: {
          input: {
            name: name.trim(),
            ...(description.trim() !== '' && { description: description.trim() }),
            permissionKeys,
          },
        },
      })
    }
  }

  const isSubmitting = isCreating || isUpdating

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${role.name}` : 'Create role'}
      description={
        isEdit
          ? 'Update which permissions this role grants.'
          : 'Name the role and choose the permissions it grants.'
      }
    >
      <div className="flex flex-col gap-6">
        <Input
          label="Name"
          required
          value={name}
          disabled={isEdit || isSubmitting}
          {...(isEdit && { helperText: 'A role’s name can’t be changed after creation.' })}
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea
          label="Description"
          rows={2}
          value={description}
          disabled={isEdit || isSubmitting}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="flex flex-col gap-4">
          <span className="text-fg-default text-sm font-medium">Permissions</span>
          {groupByDomain(allPermissions).map(([domain, permissions]) => (
            <div key={domain} className="flex flex-col gap-2">
              <span className="text-fg-muted text-xs font-semibold uppercase">{domain}</span>
              {permissions.map((permission) => (
                <Checkbox
                  key={permission.id}
                  label={permission.key}
                  checked={selectedKeys.has(permission.key)}
                  disabled={isSubmitting}
                  onChange={() => toggleKey(permission.key)}
                />
              ))}
            </div>
          ))}
        </div>

        {error !== undefined && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create role'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
