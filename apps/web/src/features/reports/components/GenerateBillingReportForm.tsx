import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Input, Modal } from '@shared/components'
import {
  buildGenerateBillingReportFormSchema,
  type GenerateBillingReportFormValues,
} from './generateBillingReportForm.schema'

export interface GenerateBillingReportFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GenerateBillingReportFormValues) => void
  isSubmitting: boolean
  // Drives both the schema's validation branch and whether the Partner ID
  // field renders at all — a Partner caller's own partnerId always wins
  // server-side (GenerateBillingReportInput's doc comment), so asking them
  // to enter one would be misleading.
  isAdmin: boolean
}

function errorProp(message: string | undefined): { error?: string } {
  return message === undefined ? {} : { error: message }
}

// A short, target-scoped form — a Modal, not a page, per
// docs/ui-guidelines.md § Dialogs & Modals, same split as RecordPaymentForm.
export function GenerateBillingReportForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  isAdmin,
}: GenerateBillingReportFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateBillingReportFormValues>({
    resolver: zodResolver(buildGenerateBillingReportFormSchema(isAdmin)),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { partnerId: '', periodStart: '', periodEnd: '' },
  })

  // useForm's state lives in this component, not inside Modal's children — it
  // survives Modal's own open/close mount cycle, so the fields must be reset
  // explicitly whenever the dialog closes (cancel or a completed
  // submission), not just on unmount.
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Generate billing report"
      description="Reconciles gross revenue, commission, and net payout for a Partner/period from the Invoice ledger."
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-4"
      >
        <fieldset disabled={isSubmitting} className="contents">
          {isAdmin && (
            // No partner-listing query exists yet on the schema (verified
            // directly against apps/api/src/schema.gql — no `Partner` type,
            // no `partners`/`partnerOptions` query) to back a `Select` here.
            // A plain text id input is the honest interim control — not a
            // fake dropdown — until a partner-listing query ships (M15 plan
            // §5's flagged, accepted gap).
            <Input
              label="Partner ID"
              required
              {...register('partnerId')}
              {...errorProp(errors.partnerId?.message)}
            />
          )}
          <Input
            label="Period start"
            type="date"
            required
            {...register('periodStart')}
            {...errorProp(errors.periodStart?.message)}
          />
          <Input
            label="Period end"
            type="date"
            required
            {...register('periodEnd')}
            {...errorProp(errors.periodEnd?.message)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Generate
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
