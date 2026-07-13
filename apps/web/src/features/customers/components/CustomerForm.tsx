import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CustomerType } from '@lib/graphql/__generated__/graphql'
import { Button, Input, Select, type SelectOption } from '@shared/components'
import { customerFormSchema, type CustomerFormValues } from './customerForm.schema'

const TYPE_OPTIONS: SelectOption[] = [
  { value: CustomerType.Individual, label: 'Individual' },
  { value: CustomerType.Organization, label: 'Organization' },
]

export interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues> | undefined
  onSubmit: (values: CustomerFormValues) => void
  isSubmitting: boolean
  submitLabel: string
}

// exactOptionalPropertyTypes forbids passing `error={undefined}` to the
// shared field components — same pattern as ProductForm/OrderForm.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// One component for both create (/customers/new) and edit (/customers/:id/edit)
// — CustomerFormPage decides which mutation `onSubmit` wraps. Unlike
// ProductForm, every field applies in both modes (docs/authorization.md §
// Ownership Rules — Admin creates; Partner/Admin edit within their scope).
export function CustomerForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    ...(defaultValues !== undefined && { defaultValues }),
  })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-6">
      {/* `contents` keeps every field a direct flex child of <form> (preserving
          the gap-6 layout) while still disabling every nested control while
          submitting — same pattern as ProductForm/OrderForm. */}
      <fieldset disabled={isSubmitting} className="contents">
        <div className="flex flex-col gap-4">
          <Input
            label="Display name"
            required
            {...register('displayName')}
            {...errorProp(errors.displayName?.message)}
          />
          <Select
            label="Type"
            required
            options={TYPE_OPTIONS}
            {...register('type')}
            {...errorProp(errors.type?.message)}
          />
          <Input
            label="Billing email"
            type="email"
            required
            {...register('billingEmail')}
            {...errorProp(errors.billingEmail?.message)}
          />
        </div>

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
