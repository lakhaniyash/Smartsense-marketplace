import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { Button, Input, Select, Textarea, type SelectOption } from '@shared/components'
import { CategorySelect } from './CategorySelect'
import { buildProductFormSchema, type ProductFormValues } from './productForm.schema'

const STATUS_OPTIONS: SelectOption[] = [
  { value: ProductStatus.Draft, label: 'Draft' },
  { value: ProductStatus.PendingReview, label: 'Pending review' },
  { value: ProductStatus.Published, label: 'Published' },
  { value: ProductStatus.Archived, label: 'Archived' },
]

export interface ProductFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ProductFormValues> | undefined
  onSubmit: (values: ProductFormValues) => void
  isSubmitting: boolean
  submitLabel: string
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
// `mode` also decides which fields render: sku/price seed the initial
// default ProductVariant (create only); status only makes sense once
// editing an existing Product.
export function ProductForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(buildProductFormSchema(mode)),
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
      {mode === 'create' && (
        <>
          <Input label="SKU" required {...register('sku')} {...errorProp(errors.sku?.message)} />
          <Input
            label="Price"
            required
            helperText="e.g. 19.99"
            {...register('price')}
            {...errorProp(errors.price?.message)}
          />
        </>
      )}
      <Textarea
        label="Description"
        {...register('description')}
        {...errorProp(errors.description?.message)}
      />
      <Input label="Brand" {...register('brand')} {...errorProp(errors.brand?.message)} />
      {mode === 'edit' && (
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
