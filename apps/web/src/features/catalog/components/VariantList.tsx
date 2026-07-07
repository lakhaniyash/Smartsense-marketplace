import { useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  ArchiveProductVariantDocument,
  GetProductByIdDocument,
  SetDefaultProductVariantDocument,
  type ProductVariant,
} from '@lib/graphql/__generated__/graphql'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@shared/components'
import { ProductsIcon } from '@shared/icons'
import { InventoryAdjustDialog, type InventoryAdjustDialogVariant } from './InventoryAdjustDialog'
import { VariantFormDrawer } from './VariantFormDrawer'
import { VariantStatusBadge } from './VariantStatusBadge'

export interface VariantListProps {
  productId: string
  variants: ProductVariant[]
  canEdit: boolean
}

// The Variant list, its inventory columns (satisfying the "Inventory view"
// requirement inline rather than as a separate page), and every Variant
// action (add/edit/set-default/archive/adjust-stock) live in one component —
// docs/ui-guidelines.md's Table conventions (loading/empty states, responsive
// stacked-card layout below `md`) apply here exactly as they do for Products.
export function VariantList({ productId, variants, canEdit }: VariantListProps) {
  const { toast } = useToast()
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | undefined>(undefined)
  const [adjustingVariant, setAdjustingVariant] = useState<
    InventoryAdjustDialogVariant | undefined
  >(undefined)
  const [archivingVariant, setArchivingVariant] = useState<ProductVariant | undefined>(undefined)
  const [settingDefaultId, setSettingDefaultId] = useState<string | undefined>(undefined)

  const [setDefaultProductVariant] = useMutation(SetDefaultProductVariantDocument, {
    refetchQueries: [GetProductByIdDocument],
    onCompleted: () => {
      toast({ title: 'Default variant updated', variant: 'success' })
      setSettingDefaultId(undefined)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't set default variant",
        description: mutationError.message,
        variant: 'danger',
      })
      setSettingDefaultId(undefined)
    },
  })

  const [archiveProductVariant, { loading: isArchiving }] = useMutation(
    ArchiveProductVariantDocument,
    {
      refetchQueries: [GetProductByIdDocument],
      onCompleted: () => {
        toast({ title: 'Variant archived', variant: 'success' })
        setArchivingVariant(undefined)
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't archive variant",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  function handleSetDefault(variant: ProductVariant) {
    setSettingDefaultId(variant.id)
    void setDefaultProductVariant({ variables: { id: variant.id } })
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsAddingVariant(true)}>
            Add variant
          </Button>
        </div>
      )}

      {variants.length === 0 ? (
        <EmptyState
          icon={<ProductsIcon className="size-8" aria-hidden="true" />}
          title="No variants yet"
          description="Add a variant to make this product sellable."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Sellable</TableHead>
              <TableHead>Default</TableHead>
              {canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell label="SKU">{variant.sku}</TableCell>
                <TableCell label="Price">{variant.price}</TableCell>
                <TableCell label="Status">
                  <VariantStatusBadge status={variant.status} />
                </TableCell>
                <TableCell label="On hand">{variant.inventory.quantityOnHand}</TableCell>
                <TableCell label="Reserved">{variant.inventory.quantityReserved}</TableCell>
                <TableCell label="Sellable">{variant.inventory.sellableQuantity}</TableCell>
                <TableCell label="Default">
                  {variant.isDefault ? (
                    <Badge variant="info">Default</Badge>
                  ) : (
                    canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={settingDefaultId === variant.id}
                        onClick={() => handleSetDefault(variant)}
                      >
                        Set default
                      </Button>
                    )
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell label="Actions">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingVariant(variant)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAdjustingVariant({
                            id: variant.id,
                            sku: variant.sku,
                            quantityOnHand: variant.inventory.quantityOnHand,
                          })
                        }
                      >
                        Adjust stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchivingVariant(variant)}
                      >
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <VariantFormDrawer
        productId={productId}
        open={isAddingVariant}
        onOpenChange={setIsAddingVariant}
      />

      <VariantFormDrawer
        productId={productId}
        variant={editingVariant}
        open={editingVariant !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditingVariant(undefined)
        }}
      />

      <InventoryAdjustDialog
        variant={adjustingVariant}
        open={adjustingVariant !== undefined}
        onOpenChange={(open) => {
          if (!open) setAdjustingVariant(undefined)
        }}
      />

      <Dialog
        open={archivingVariant !== undefined}
        onOpenChange={(open) => {
          if (!open) setArchivingVariant(undefined)
        }}
        title="Archive this variant?"
        description={`"${archivingVariant?.sku ?? ''}" will no longer be available for purchase. This cannot be undone from here.`}
        confirmLabel="Archive"
        variant="danger"
        isConfirming={isArchiving}
        onConfirm={() => {
          if (archivingVariant !== undefined) {
            void archiveProductVariant({ variables: { id: archivingVariant.id } })
          }
        }}
      />
    </div>
  )
}
