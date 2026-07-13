import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AddressType } from '@lib/graphql/__generated__/graphql'
import { Button, Checkbox, Input, Select, type SelectOption } from '@shared/components'
import { addressFormSchema, type AddressFormValues } from './addressForm.schema'

const TYPE_OPTIONS: SelectOption[] = [
  { value: AddressType.Shipping, label: 'Shipping' },
  { value: AddressType.Billing, label: 'Billing' },
  { value: AddressType.Registered, label: 'Registered' },
]

export interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues> | undefined
  onSubmit: (values: AddressFormValues) => void
  isSubmitting: boolean
  submitLabel: string
}

// exactOptionalPropertyTypes forbids passing `error={undefined}` — same
// pattern as ProductForm/CustomerForm.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// Short, context-local form rendered inside AddressFormDrawer — one
// component for both add and edit, same shape as VariantForm.
export function AddressForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { type: AddressType.Shipping, isDefault: false, ...defaultValues },
  })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4">
      <fieldset disabled={isSubmitting} className="contents">
        <Select
          label="Type"
          required
          options={TYPE_OPTIONS}
          {...register('type')}
          {...errorProp(errors.type?.message)}
        />
        <Input
          label="Address line 1"
          required
          {...register('line1')}
          {...errorProp(errors.line1?.message)}
        />
        <Input
          label="Address line 2"
          {...register('line2')}
          {...errorProp(errors.line2?.message)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="City" required {...register('city')} {...errorProp(errors.city?.message)} />
          <Input
            label="State"
            required
            {...register('state')}
            {...errorProp(errors.state?.message)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Postal code"
            required
            {...register('postalCode')}
            {...errorProp(errors.postalCode?.message)}
          />
          <Input
            label="Country"
            required
            {...register('country')}
            {...errorProp(errors.country?.message)}
          />
        </div>
        <Checkbox label="Default address" {...register('isDefault')} />

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
