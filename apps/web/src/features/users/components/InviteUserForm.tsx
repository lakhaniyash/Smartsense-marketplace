import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type InviteUserInput, UserOwnerType } from '@lib/graphql/__generated__/graphql'
import { Button, Checkbox, Input, Select, type SelectOption } from '@shared/components'
import { useRoles } from '../hooks'
import { inviteUserFormSchema, type InviteUserFormValues } from './inviteUserForm.schema'

const OWNER_TYPE_OPTIONS: SelectOption[] = [
  { value: UserOwnerType.None, label: 'Platform staff' },
  { value: UserOwnerType.Partner, label: 'Partner' },
  { value: UserOwnerType.Customer, label: 'Customer' },
]

// exactOptionalPropertyTypes forbids `error={undefined}` — same helper as
// CustomerForm.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

export interface InviteUserFormProps {
  onSubmit: (input: InviteUserInput) => void
  isSubmitting: boolean
}

// roleIds is a multi-value checkbox group, which RHF register can't cleanly
// bind (and this repo has no Controller precedent), so it's held in local
// state and validated on submit — the scalar fields stay on RHF + Zod.
export function InviteUserForm({ onSubmit, isSubmitting }: InviteUserFormProps) {
  const { roles, isLoading: rolesLoading } = useRoles()
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [roleError, setRoleError] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { ownerType: UserOwnerType.None, partnerId: '', customerId: '' },
  })

  const ownerType = watch('ownerType')

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    )
    setRoleError(undefined)
  }

  function submit(values: InviteUserFormValues) {
    if (selectedRoleIds.length === 0) {
      setRoleError('Select at least one role')
      return
    }
    const input: InviteUserInput = {
      email: values.email,
      fullName: values.fullName,
      ownerType: values.ownerType,
      roleIds: selectedRoleIds,
    }
    if (values.ownerType === UserOwnerType.Partner && values.partnerId !== '') {
      input.partnerId = values.partnerId
    }
    if (values.ownerType === UserOwnerType.Customer && values.customerId !== '') {
      input.customerId = values.customerId
    }
    onSubmit(input)
  }

  return (
    <form onSubmit={(event) => void handleSubmit(submit)(event)} className="flex flex-col gap-6">
      <fieldset disabled={isSubmitting} className="contents">
        <Input
          label="Full name"
          required
          {...register('fullName')}
          {...errorProp(errors.fullName?.message)}
        />
        <Input
          label="Email"
          type="email"
          required
          {...register('email')}
          {...errorProp(errors.email?.message)}
        />
        <Select
          label="Account type"
          options={OWNER_TYPE_OPTIONS}
          required
          {...register('ownerType')}
          {...errorProp(errors.ownerType?.message)}
        />
        {ownerType === UserOwnerType.Partner && (
          <Input
            label="Partner id"
            helperText="The partner organization this user acts on behalf of."
            {...register('partnerId')}
            {...errorProp(errors.partnerId?.message)}
          />
        )}
        {ownerType === UserOwnerType.Customer && (
          <Input
            label="Customer id"
            helperText="The customer organization this user acts on behalf of."
            {...register('customerId')}
            {...errorProp(errors.customerId?.message)}
          />
        )}
        <div className="flex flex-col gap-2">
          <span className="text-fg-default text-sm font-medium">Roles</span>
          {rolesLoading ? (
            <p className="text-fg-muted text-sm">Loading roles…</p>
          ) : (
            roles.map((role) => (
              <Checkbox
                key={role.id}
                label={role.name}
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
            ))
          )}
          {roleError !== undefined && <p className="text-danger text-sm">{roleError}</p>}
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          Send invite
        </Button>
      </fieldset>
    </form>
  )
}
