import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { Button, Input, Select, Textarea, type SelectOption } from '@shared/components'
import { CategorySelect } from './CategorySelect'
import { productFormSchema, type ProductFormValues } from './productForm.schema'

const STATUS_OPTIONS: SelectOption[] = [
  { value: ProductStatus.Draft, label: 'Draft' },
  { value: ProductStatus.PendingReview, label: 'Pending review' },
  { value: ProductStatus.Published, label: 'Published' },
  { value: ProductStatus.Archived, label: 'Archived' },
]

export interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues> | undefined
  onSubmit: (values: ProductFormValues) => void
  isSubmitting: boolean
  submitLabel: string
  // A new Product always starts DRAFT (docs/domain-model.md § Catalog
  // Management) — the status field only makes sense once editing an
  // existing one.
  showStatusField?: boolean
}

// exactOptionalPropertyTypes forbids passing `error={undefined}` to the
// shared field components (their `error?: string` means "absent," not
// "present and undefined") — this omits the prop entirely when there's no
// message instead of assigning it explicitly.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// One page hosts both create and edit (SM-113) — this component is the
// shared form; ProductFormPage decides which mutation `onSubmit` wraps.
export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  showStatusField = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    ...(defaultValues !== undefined && { defaultValues }),
  })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4">
      <Input label="Title" required {...register('title')} {...errorProp(errors.title?.message)} />
      <CategorySelect
        required
        {...register('categoryId')}
        {...errorProp(errors.categoryId?.message)}
      />
      <Input label="SKU" required {...register('sku')} {...errorProp(errors.sku?.message)} />
      <Textarea
        label="Description"
        {...register('description')}
        {...errorProp(errors.description?.message)}
      />
      <Input label="Brand" {...register('brand')} {...errorProp(errors.brand?.message)} />
      {showStatusField && (
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          {...register('status')}
          {...errorProp(errors.status?.message)}
        />
      )}
      <div>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
