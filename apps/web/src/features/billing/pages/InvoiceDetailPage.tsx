import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  GetInvoiceByIdDocument,
  InvoiceStatus,
  PaymentStatus,
  RecordPaymentDocument,
  VoidInvoiceDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  type BadgeVariant,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { useBreadcrumb } from '@shared/layouts'
import { base64ToUint8Array, downloadBlob } from '@shared/utils'
import { InvoiceStatusBadge, RecordPaymentForm, type RecordPaymentFormValues } from '../components'
import { useInvoice } from '../hooks'
import { fetchInvoicePdf } from '../services'

// v1 has no live payment gateway (docs/roadmap.md) — recordPayment always
// creates a SUCCEEDED payment today, but PENDING/FAILED/REFUNDED already
// exist on the schema for a future gateway integration.
const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  [PaymentStatus.Succeeded]: 'success',
  [PaymentStatus.Pending]: 'warning',
  [PaymentStatus.Failed]: 'danger',
  [PaymentStatus.Refunded]: 'neutral',
}

// The shell renders its breadcrumb automatically from route metadata
// (shared/layouts/Breadcrumbs.tsx) — same pattern as OrderDetailPage;
// useBreadcrumb below only supplies the real invoice number once it loads.
export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { invoice, isLoading, error } = useInvoice(id)
  const { canManageBilling, canViewBilling } = usePermissions()
  const { toast } = useToast()
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [isConfirmingVoid, setIsConfirmingVoid] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  useBreadcrumb(invoice !== undefined ? `Invoice #${invoice.invoiceNumber}` : undefined)

  const [recordPayment, { loading: isSubmittingPayment }] = useMutation(RecordPaymentDocument, {
    refetchQueries: [GetInvoiceByIdDocument],
    onCompleted: () => {
      setIsRecordingPayment(false)
      toast({ title: 'Payment recorded', variant: 'success' })
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't record payment",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  const [voidInvoice, { loading: isVoiding }] = useMutation(VoidInvoiceDocument, {
    refetchQueries: [GetInvoiceByIdDocument],
    onCompleted: () => {
      setIsConfirmingVoid(false)
      toast({ title: 'Invoice voided', variant: 'success' })
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't void invoice",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  // Ownership is already enforced by the `invoice` query's server-side
  // scoping (a Partner can only ever fetch their own invoices) — the
  // remaining client-side gate is just the row-specific permission
  // (docs/authorization.md § Billing) and the invoice's current status.
  const canVoid =
    invoice !== undefined &&
    canManageBilling &&
    (invoice.status === InvoiceStatus.Draft || invoice.status === InvoiceStatus.Issued)

  function handleRecordPayment(values: RecordPaymentFormValues) {
    if (invoice === undefined) return
    void recordPayment({
      variables: {
        input: {
          invoiceId: invoice.id,
          amount: values.amount,
          method: values.method,
          externalTransactionId: values.externalTransactionId,
          // Caller-generated per docs/graphql.md's idempotency convention —
          // a retried submission (e.g. after a dropped response) must reuse
          // the same key, but this form always treats a fresh submit as a
          // fresh payment attempt, so a new key is minted right here.
          idempotencyKey: crypto.randomUUID(),
        },
      },
    })
  }

  async function handleDownloadPdf() {
    if (invoice === undefined) return
    setIsDownloadingPdf(true)
    try {
      const base64 = await fetchInvoicePdf(invoice.id)
      downloadBlob(
        new Blob([base64ToUint8Array(base64)], { type: 'application/pdf' }),
        `${invoice.invoiceNumber}.pdf`,
      )
    } catch (downloadError) {
      toast({
        title: "Couldn't download invoice PDF",
        ...(downloadError instanceof Error && { description: downloadError.message }),
        variant: 'danger',
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (error !== undefined || invoice === undefined) && (
        <ErrorState
          title="Couldn't load this invoice"
          description="It may not exist, or you may not have access to it."
          action={
            <Link
              to={ROUTES.BILLING}
              className="border-border-control bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Back to billing
            </Link>
          }
        />
      )}

      {!isLoading && error === undefined && invoice !== undefined && (
        <>
          <PageHeader
            title={`Invoice #${invoice.invoiceNumber}`}
            description={`Issued ${invoice.issuedAt !== null && invoice.issuedAt !== undefined ? new Date(invoice.issuedAt as string).toLocaleString() : '—'}`}
            action={
              <div className="flex gap-2">
                {canViewBilling && (
                  <Button
                    variant="secondary"
                    isLoading={isDownloadingPdf}
                    onClick={() => void handleDownloadPdf()}
                  >
                    Download PDF
                  </Button>
                )}
                {canManageBilling && (
                  <Button onClick={() => setIsRecordingPayment(true)}>Record Payment</Button>
                )}
                {canVoid && (
                  <Button variant="danger" onClick={() => setIsConfirmingVoid(true)}>
                    Void Invoice
                  </Button>
                )}
              </div>
            }
          />
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <InvoiceStatusBadge status={invoice.status} />
                <span className="text-fg-muted text-sm">Amount due: ${invoice.amountDue}</span>
                <span className="text-fg-muted text-sm">
                  Due{' '}
                  {invoice.dueAt !== null && invoice.dueAt !== undefined
                    ? new Date(invoice.dueAt as string).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>External transaction ID</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell label="Amount">${payment.amount}</TableCell>
                      <TableCell label="Method">{payment.method}</TableCell>
                      <TableCell label="Status">
                        <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell label="External transaction ID">
                        {payment.externalTransactionId}
                      </TableCell>
                      <TableCell label="Processed">
                        {payment.processedAt !== null && payment.processedAt !== undefined
                          ? new Date(payment.processedAt as string).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {canManageBilling && (
            <>
              <RecordPaymentForm
                open={isRecordingPayment}
                onOpenChange={setIsRecordingPayment}
                onSubmit={handleRecordPayment}
                isSubmitting={isSubmittingPayment}
              />
              <Dialog
                open={isConfirmingVoid}
                onOpenChange={setIsConfirmingVoid}
                title="Void this invoice?"
                description={`Invoice #${invoice.invoiceNumber} will be marked void. This cannot be undone.`}
                confirmLabel="Void invoice"
                variant="danger"
                isConfirming={isVoiding}
                onConfirm={() => void voidInvoice({ variables: { id: invoice.id } })}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
