import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, Card, CardContent, Input, Select } from '@shared/components'
import { CloseIcon } from '@shared/icons'
import { useOrderableVariants } from '../hooks'
import { orderFormSchema, type OrderFormValues } from './orderForm.schema'

export interface OrderFormProps {
  onSubmit: (values: OrderFormValues) => void
  isSubmitting: boolean
}

// exactOptionalPropertyTypes forbids passing `error={undefined}` to the
// shared field components — same pattern as ProductForm/VariantForm.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// A repeatable line-item picker (useFieldArray, same pattern as
// VariantForm's attributes list) plus a client-side subtotal preview — the
// server always recomputes the authoritative total (docs/api-conventions.md
// § Validation), this is purely informational.
export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const [variantSearch, setVariantSearch] = useState<string | undefined>(undefined)
  const {
    options: variantOptions,
    isLoading: isVariantsLoading,
    error: variantsError,
  } = useOrderableVariants(variantSearch)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { items: [{ productVariantId: '', quantity: '1' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const subtotalPreview = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const variant = variantOptions.find((option) => option.variantId === item.productVariantId)
      const quantity = Number(item.quantity)
      if (variant === undefined || !Number.isFinite(quantity)) return sum
      return sum + Number(variant.price) * quantity
    }, 0)
  }, [watchedItems, variantOptions])

  const variantSelectOptions = variantOptions.map((option) => ({
    value: option.variantId,
    label: option.label,
  }))
  // Distinguishes "still fetching," "the request failed," and "there are no
  // sellable products" — all three previously collapsed into the same bare,
  // empty dropdown (docs/ui-guidelines.md's Loading/Empty/Error split).
  const variantSelectPlaceholder = isVariantsLoading
    ? 'Loading products…'
    : variantsError !== undefined
      ? 'Failed to load products'
      : variantSelectOptions.length === 0
        ? 'No sellable products found'
        : 'Select a product'

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4">
      {/* `contents` keeps every field a direct flex child of <form> (preserving
          the gap-4 layout) while still disabling every nested control — including
          the add/remove-item buttons — while submitting. */}
      <fieldset disabled={isSubmitting} className="contents">
        <Input
          label="Search products"
          placeholder="Filter by product title or SKU"
          onChange={(event) => setVariantSearch(event.target.value || undefined)}
        />

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-fg-default text-sm font-medium">Items</span>
            {typeof errors.items?.message === 'string' && (
              <p className="text-danger text-sm">{errors.items.message}</p>
            )}
            {variantsError !== undefined && (
              <p className="text-danger text-sm">Failed to load products. Please try again.</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Select
                  aria-label={`Item ${index + 1} product`}
                  placeholder={variantSelectPlaceholder}
                  options={variantSelectOptions}
                  disabled={isVariantsLoading || variantsError !== undefined}
                  {...register(`items.${index}.productVariantId`)}
                  {...errorProp(errors.items?.[index]?.productVariantId?.message)}
                />
                <Input
                  aria-label={`Item ${index + 1} quantity`}
                  type="number"
                  min={1}
                  className="w-24"
                  {...register(`items.${index}.quantity`)}
                  {...errorProp(errors.items?.[index]?.quantity?.message)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove item"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <CloseIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ productVariantId: '', quantity: '1' })}
              >
                Add item
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="border-border-default flex flex-col gap-4 border-t pt-4">
          <p className="text-fg-default text-sm font-medium">Delivery details</p>
          <Input
            label="Customer ID"
            helperText="Only required when placing an order on behalf of a customer (Partner/Admin). Leave blank to order for yourself."
            {...register('customerId')}
            {...errorProp(errors.customerId?.message)}
          />
          <Input
            label="Shipping address ID"
            helperText="Optional."
            {...register('shippingAddressId')}
            {...errorProp(errors.shippingAddressId?.message)}
          />
        </div>

        <p className="text-fg-muted text-sm">
          Estimated subtotal: ${subtotalPreview.toFixed(2)} (tax/shipping computed at checkout)
        </p>

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            Create Order
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
