import { useMutation } from '@apollo/client'
import {
  AddCustomerAddressDocument,
  GetCustomerByIdDocument,
  UpdateCustomerAddressDocument,
} from '@lib/graphql/__generated__/graphql'
import { Drawer, useToast } from '@shared/components'
import { AddressForm } from './AddressForm'
import type { AddressFormValues } from './addressForm.schema'

export interface AddressFormDrawerAddress {
  id: string
  type: AddressFormValues['type']
  line1: string
  line2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface AddressFormDrawerProps {
  customerId: string
  // undefined => add mode; an Address => edit mode.
  address?: AddressFormDrawerAddress | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Short, context-local form — a Drawer, not a page, per docs/ui-guidelines.md
// § Dialogs & Modals, same pattern as Catalog's VariantFormDrawer. One
// Drawer instance is reused for both add and edit; `key` on AddressForm
// forces it to remount (and re-read defaultValues) when the target changes.
export function AddressFormDrawer({
  customerId,
  address,
  open,
  onOpenChange,
}: AddressFormDrawerProps) {
  const { toast } = useToast()
  const isEditMode = address !== undefined

  const [addCustomerAddress, { loading: isAdding }] = useMutation(AddCustomerAddressDocument, {
    refetchQueries: [GetCustomerByIdDocument],
    onCompleted: () => {
      toast({ title: 'Address added', variant: 'success' })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't add address",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  const [updateCustomerAddress, { loading: isUpdating }] = useMutation(
    UpdateCustomerAddressDocument,
    {
      refetchQueries: [GetCustomerByIdDocument],
      onCompleted: () => {
        toast({ title: 'Address updated', variant: 'success' })
        onOpenChange(false)
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't update address",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  function handleSubmit(values: AddressFormValues) {
    const line2 = values.line2 === '' ? undefined : values.line2
    if (isEditMode) {
      void updateCustomerAddress({
        variables: {
          input: {
            id: address.id,
            type: values.type,
            line1: values.line1,
            ...(line2 !== undefined && { line2 }),
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
            isDefault: values.isDefault,
          },
        },
      })
    } else {
      void addCustomerAddress({
        variables: {
          input: {
            customerId,
            type: values.type,
            line1: values.line1,
            ...(line2 !== undefined && { line2 }),
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
            isDefault: values.isDefault,
          },
        },
      })
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit address' : 'Add address'}
      description={isEditMode ? `Editing ${address.line1}` : 'Add a new address to this customer.'}
    >
      <AddressForm
        key={address?.id ?? 'new'}
        defaultValues={
          address !== undefined
            ? {
                type: address.type,
                line1: address.line1,
                line2: address.line2 ?? undefined,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
                isDefault: address.isDefault,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={isAdding || isUpdating}
        submitLabel={isEditMode ? 'Save changes' : 'Add address'}
      />
    </Drawer>
  )
}
