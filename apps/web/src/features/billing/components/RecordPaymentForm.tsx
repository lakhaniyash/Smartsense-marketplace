import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PaymentMethod } from '@lib/graphql/__generated__/graphql'
import { Button, Input, Modal, Select, type SelectOption } from '@shared/components'
import { recordPaymentFormSchema, type RecordPaymentFormValues } from './recordPaymentForm.schema'

const METHOD_OPTIONS: SelectOption[] = [
  { value: PaymentMethod.Card, label: 'Card' },
  { value: PaymentMethod.BankTransfer, label: 'Bank transfer' },
  { value: PaymentMethod.Other, label: 'Other' },
]

export interface RecordPaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RecordPaymentFormValues) => void
  isSubmitting: boolean
}

function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// A short, target-scoped form — a Modal, not a page, per docs/ui-guidelines.md
// § Dialogs & Modals. The mutation itself (and the idempotencyKey it needs)
// stays with InvoiceDetailPage, which owns the invoice being paid and the
// `recordPayment` call; this component only collects and validates the
// three user-entered fields, same split as OrderForm/OrderFormPage.
export function RecordPaymentForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: RecordPaymentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { amount: '', method: PaymentMethod.Card, externalTransactionId: '' },
  })

  // useForm's state lives in this component, not inside Modal's children —
  // it survives Modal's own open/close mount cycle, so the fields must be
  // reset explicitly whenever the dialog closes (cancel or a completed
  // submission), not just on unmount.
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      description="Log a payment received against this invoice."
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-4"
      >
        {/* `contents` keeps every field a direct flex child of <form> (preserving
            the gap-4 layout) while still disabling every nested control — including
            Cancel — while the mutation is in flight. */}
        <fieldset disabled={isSubmitting} className="contents">
          <Input
            label="Amount"
            placeholder="0.00"
            required
            {...register('amount')}
            {...errorProp(errors.amount?.message)}
          />
          <Select label="Method" options={METHOD_OPTIONS} {...register('method')} />
          <Input
            label="External transaction ID"
            required
            {...register('externalTransactionId')}
            {...errorProp(errors.externalTransactionId?.message)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Record payment
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
