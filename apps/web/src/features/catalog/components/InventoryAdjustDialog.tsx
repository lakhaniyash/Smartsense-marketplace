import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@apollo/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  AdjustInventoryDocument,
  GetProductByIdDocument,
  InventoryAdjustmentType,
} from '@lib/graphql/__generated__/graphql'
import { Button, Input, Modal, Select, useToast, type SelectOption } from '@shared/components'

const ADJUSTMENT_OPTIONS: SelectOption[] = [
  { value: InventoryAdjustmentType.Increase, label: 'Increase stock' },
  { value: InventoryAdjustmentType.Decrease, label: 'Decrease stock' },
  { value: InventoryAdjustmentType.Set, label: 'Set stock to' },
]

// Validates user input before a mutation is even sent — a UX optimization,
// not the security/correctness boundary (docs/architecture.md § Forms).
const MAX_QUANTITY = 1_000_000

const adjustInventoryFormSchema = z.object({
  adjustmentType: z.nativeEnum(InventoryAdjustmentType),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(MAX_QUANTITY, `Quantity cannot exceed ${MAX_QUANTITY.toLocaleString()}`),
  reason: z.string().trim().max(200, 'Reason is too long').optional(),
})
type AdjustInventoryFormValues = z.infer<typeof adjustInventoryFormSchema>

export interface InventoryAdjustDialogVariant {
  id: string
  sku: string
  quantityOnHand: number
}

export interface InventoryAdjustDialogProps {
  // undefined => dialog has no target and stays closed regardless of `open`.
  variant: InventoryAdjustDialogVariant | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// A short, target-scoped form — a Modal, not a page, per docs/ui-guidelines.md
// § Dialogs & Modals. Increase/decrease/set apply to quantityOnHand only;
// the service recomputes derived ACTIVE/OUT_OF_STOCK status server-side.
export function InventoryAdjustDialog({ variant, open, onOpenChange }: InventoryAdjustDialogProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustInventoryFormValues>({
    resolver: zodResolver(adjustInventoryFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { adjustmentType: InventoryAdjustmentType.Increase, quantity: 0 },
  })

  const [adjustInventory, { loading }] = useMutation(AdjustInventoryDocument, {
    refetchQueries: [GetProductByIdDocument],
    onCompleted: () => {
      toast({ title: 'Inventory updated', variant: 'success' })
      reset()
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't adjust inventory",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  function submit(values: AdjustInventoryFormValues) {
    if (variant === undefined) return

    void adjustInventory({
      variables: {
        input: {
          productVariantId: variant.id,
          adjustmentType: values.adjustmentType,
          quantity: values.quantity,
          ...(values.reason !== undefined && values.reason !== '' && { reason: values.reason }),
        },
      },
    })
  }

  if (variant === undefined) return null

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Adjust inventory"
      description={`${variant.sku} — currently ${variant.quantityOnHand} on hand.`}
    >
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="flex flex-col gap-4">
        {/* `contents` keeps every field a direct flex child of <form> (preserving
            the gap-4 layout) while still disabling every nested control — including
            Cancel — while the mutation is in flight. */}
        <fieldset disabled={loading} className="contents">
          <Select label="Adjustment" options={ADJUSTMENT_OPTIONS} {...register('adjustmentType')} />
          <Input
            label="Quantity"
            type="number"
            min={0}
            required
            {...register('quantity')}
            {...errorProp(errors.quantity?.message)}
          />
          <Input
            label="Reason"
            helperText="Optional"
            {...register('reason')}
            {...errorProp(errors.reason?.message)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Save
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
