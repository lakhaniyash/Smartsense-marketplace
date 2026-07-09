import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, Checkbox, Input } from '@shared/components'
import { CloseIcon } from '@shared/icons'
import { variantFormSchema, type VariantFormValues } from './variantForm.schema'

export interface VariantFormProps {
  defaultValues?: Partial<VariantFormValues> | undefined
  onSubmit: (values: VariantFormValues) => void
  isSubmitting: boolean
  submitLabel: string
  // The current default Variant can't unset itself — a Product must always
  // have exactly one default (docs/domain-model.md § Product Variant);
  // changing it means promoting a different Variant, not unchecking this one.
  disableDefaultToggle?: boolean
}

// exactOptionalPropertyTypes forbids passing `error={undefined}` to the
// shared field components (their `error?: string` means "absent," not
// "present and undefined") — this omits the prop entirely when there's no
// message instead of assigning it explicitly.
function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// Shared by VariantFormDrawer for both create and edit — the caller decides
// which mutation `onSubmit` wraps. Attributes are a repeatable key/value
// list (docs/domain-model.md § Product Variant: "structured key/value set,
// e.g. { size: 'M', color: 'Blue' }"), not a free-text/JSON field.
export function VariantForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  disableDefaultToggle = false,
}: VariantFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { sku: '', price: '', isDefault: false, attributes: [], ...defaultValues },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-6">
      {/* `contents` keeps every field a direct flex child of <form> (preserving
          the gap-6 layout) while still disabling every nested control — including
          the add/remove-attribute buttons — while submitting. */}
      <fieldset disabled={isSubmitting} className="contents">
        <div className="flex flex-col gap-4">
          <Input label="SKU" required {...register('sku')} {...errorProp(errors.sku?.message)} />
          <Input
            label="Price"
            required
            helperText="e.g. 19.99"
            {...register('price')}
            {...errorProp(errors.price?.message)}
          />
        </div>

        <div className="border-border-default flex flex-col gap-2 border-t pt-4">
          <span className="text-fg-default text-sm font-medium">Attributes</span>
          {fields.length === 0 && (
            <p className="text-fg-muted text-sm">No attributes yet (e.g. size, color).</p>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Input
                placeholder="Key (e.g. color)"
                aria-label={`Attribute ${index + 1} key`}
                {...register(`attributes.${index}.key`)}
                {...errorProp(errors.attributes?.[index]?.key?.message)}
              />
              <Input
                placeholder="Value (e.g. Blue)"
                aria-label={`Attribute ${index + 1} value`}
                {...register(`attributes.${index}.value`)}
                {...errorProp(errors.attributes?.[index]?.value?.message)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove attribute"
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
              onClick={() => append({ key: '', value: '' })}
            >
              Add attribute
            </Button>
          </div>
        </div>

        <div className="border-border-default flex flex-col gap-1.5 border-t pt-4">
          <Checkbox
            label="Default variant"
            disabled={disableDefaultToggle}
            {...register('isDefault')}
          />
          {disableDefaultToggle && (
            <p className="text-fg-muted text-sm">
              This is already the default — set another variant as default to change it.
            </p>
          )}
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
