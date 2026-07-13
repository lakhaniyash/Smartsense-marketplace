import { useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  DeactivateCustomerAddressDocument,
  GetCustomerByIdDocument,
  type Customer,
} from '@lib/graphql/__generated__/graphql'
import { Button, Card, CardContent, Dialog, EmptyState, useToast } from '@shared/components'
import { AddressFormDrawer } from './AddressFormDrawer'

type CustomerAddress = Customer['addresses'][number]

export interface CustomerAddressListProps {
  customerId: string
  addresses: CustomerAddress[]
  canEdit: boolean
}

// The Addresses tab on the Customer detail page — list, add/edit/deactivate
// actions all live in one component, same shape as Catalog's VariantList
// (docs/ui-guidelines.md's Table/Card conventions apply here too, though
// addresses render as cards rather than a table — there's no tabular data
// dense enough to warrant columns).
export function CustomerAddressList({ customerId, addresses, canEdit }: CustomerAddressListProps) {
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | undefined>(undefined)
  const [deactivatingAddress, setDeactivatingAddress] = useState<CustomerAddress | undefined>(
    undefined,
  )

  const [deactivateCustomerAddress, { loading: isDeactivating }] = useMutation(
    DeactivateCustomerAddressDocument,
    {
      refetchQueries: [GetCustomerByIdDocument],
      onCompleted: () => {
        toast({ title: 'Address deactivated', variant: 'success' })
        setDeactivatingAddress(undefined)
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't deactivate address",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add address
          </Button>
        </div>
      )}

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses on file"
          description="Addresses added for this customer will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-fg-default text-sm font-medium">{address.type}</span>
                  {address.isDefault && <span className="text-fg-muted text-xs">Default</span>}
                </div>
                <span className="text-fg-secondary text-sm">{address.line1}</span>
                {address.line2 !== null && address.line2 !== undefined && (
                  <span className="text-fg-secondary text-sm">{address.line2}</span>
                )}
                <span className="text-fg-secondary text-sm">
                  {address.city}, {address.state} {address.postalCode}
                </span>
                <span className="text-fg-secondary text-sm">{address.country}</span>
                {canEdit && (
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeactivatingAddress(address)}
                    >
                      Deactivate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressFormDrawer customerId={customerId} open={isAdding} onOpenChange={setIsAdding} />

      <AddressFormDrawer
        customerId={customerId}
        address={editingAddress}
        open={editingAddress !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditingAddress(undefined)
        }}
      />

      <Dialog
        open={deactivatingAddress !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeactivatingAddress(undefined)
        }}
        title="Deactivate this address?"
        description={`"${deactivatingAddress?.line1 ?? ''}" will no longer show up for this customer. This cannot be undone from here.`}
        confirmLabel="Deactivate"
        variant="danger"
        isConfirming={isDeactivating}
        onConfirm={() => {
          if (deactivatingAddress === undefined) return
          void deactivateCustomerAddress({ variables: { id: deactivatingAddress.id } })
        }}
      />
    </div>
  )
}
