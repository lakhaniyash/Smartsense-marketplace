import { useMutation } from '@apollo/client'
import {
  CreateProductVariantDocument,
  GetProductByIdDocument,
  UpdateProductVariantDocument,
} from '@lib/graphql/__generated__/graphql'
import { Drawer, useToast } from '@shared/components'
import { VariantForm } from './VariantForm'
import type { VariantFormValues } from './variantForm.schema'

export interface VariantFormDrawerVariant {
  id: string
  sku: string
  price: string
  isDefault: boolean
  attributes: Array<{ key: string; value: string }>
}

export interface VariantFormDrawerProps {
  productId: string
  // undefined => create mode; a Variant => edit mode.
  variant?: VariantFormDrawerVariant | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Short, context-local form — a Drawer, not a page, per docs/ui-guidelines.md
// § Dialogs & Modals (Forms in dialogs/drawers reserved for short forms
// belonging to their triggering context). One Drawer instance is reused for
// both add and edit; `key` below forces VariantForm to remount (and thus
// re-read `defaultValues`) whenever the target Variant changes.
export function VariantFormDrawer({
  productId,
  variant,
  open,
  onOpenChange,
}: VariantFormDrawerProps) {
  const { toast } = useToast()
  const isEditMode = variant !== undefined

  const [createProductVariant, { loading: isCreating }] = useMutation(
    CreateProductVariantDocument,
    {
      refetchQueries: [GetProductByIdDocument],
      onCompleted: () => {
        toast({ title: 'Variant added', variant: 'success' })
        onOpenChange(false)
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't add variant",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  const [updateProductVariant, { loading: isUpdating }] = useMutation(
    UpdateProductVariantDocument,
    {
      refetchQueries: [GetProductByIdDocument],
      onCompleted: () => {
        toast({ title: 'Variant updated', variant: 'success' })
        onOpenChange(false)
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't update variant",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  function handleSubmit(values: VariantFormValues) {
    if (isEditMode) {
      void updateProductVariant({
        variables: {
          input: {
            id: variant.id,
            sku: values.sku,
            price: values.price,
            isDefault: values.isDefault,
            attributes: values.attributes,
          },
        },
      })
    } else {
      void createProductVariant({
        variables: {
          input: {
            productId,
            sku: values.sku,
            price: values.price,
            isDefault: values.isDefault,
            attributes: values.attributes,
          },
        },
      })
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit variant' : 'Add variant'}
      description={
        isEditMode ? `Editing ${variant.sku}` : 'Add a new sellable variant to this product.'
      }
    >
      <VariantForm
        key={variant?.id ?? 'new'}
        defaultValues={variant}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        submitLabel={isEditMode ? 'Save changes' : 'Add variant'}
        disableDefaultToggle={variant?.isDefault ?? false}
      />
    </Drawer>
  )
}
