import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  BillingReportStatus,
  FinalizeBillingReportDocument,
  GetBillingReportDocument,
  MarkBillingReportPaidOutDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  useToast,
} from '@shared/components'
import { useBreadcrumb } from '@shared/layouts'
import { ROUTES } from '@shared/constants'
import { BillingReportStatusBadge } from '../components'
import { useBillingReport } from '../hooks'

// A real anchor to the known list route, not `window.history.back()` — a
// bookmarked/shared detail-page URL has no in-app history entry to go back
// to, and "back" would then leave the app entirely (see SM-244's identical
// fix for list-page pagination). Styled to match Button's secondary/md
// variant, matching the `Link`-styled-as-button precedent already used by
// `dashboard/components/QuickActions.tsx` for the same navigation-vs-action
// reason (Button renders a real `<button>`, this is a navigation, not a
// form action).
const BACK_LINK_CLASSES =
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border border-border-control bg-surface text-fg-secondary hover:bg-surface-subtle focus-visible:outline-focus-ring h-10 gap-2 px-4 text-sm'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

// A near-clone of InvoiceDetailPage (M15 plan § Frontend Architecture) —
// GENERATED -> FINALIZED -> PAID_OUT (docs/domain-model.md § Billing Report
// lifecycle), each transition a single-click mutation gated by the report's
// current status, confirmed via Dialog since both are one-way, irreversible
// transitions.
export function BillingReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { billingReport, isLoading, error } = useBillingReport(id)
  const { canViewReports } = usePermissions()
  const { toast } = useToast()
  const [isConfirmingFinalize, setIsConfirmingFinalize] = useState(false)
  const [isConfirmingPaidOut, setIsConfirmingPaidOut] = useState(false)
  useBreadcrumb(
    billingReport !== undefined
      ? `${formatDate(billingReport.periodStart as string)} – ${formatDate(billingReport.periodEnd as string)}`
      : undefined,
  )

  const [finalizeBillingReport, { loading: isFinalizing }] = useMutation(
    FinalizeBillingReportDocument,
    {
      refetchQueries: [GetBillingReportDocument],
      onCompleted: () => {
        setIsConfirmingFinalize(false)
        toast({ title: 'Billing report finalized', variant: 'success' })
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't finalize billing report",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  const [markBillingReportPaidOut, { loading: isMarkingPaidOut }] = useMutation(
    MarkBillingReportPaidOutDocument,
    {
      refetchQueries: [GetBillingReportDocument],
      onCompleted: () => {
        setIsConfirmingPaidOut(false)
        toast({ title: 'Billing report marked paid out', variant: 'success' })
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't mark billing report paid out",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  // Same split as InvoiceDetailPage: server-side scoping already restricted
  // which report this Partner could ever fetch — the remaining client-side
  // gate is just the permission plus the report's current lifecycle status
  // (docs/authorization.md § Reports).
  const canFinalize =
    billingReport !== undefined &&
    canViewReports &&
    billingReport.status === BillingReportStatus.Generated
  const canMarkPaidOut =
    billingReport !== undefined &&
    canViewReports &&
    billingReport.status === BillingReportStatus.Finalized

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

      {!isLoading && (error !== undefined || billingReport === undefined) && (
        <ErrorState
          title="Couldn't load this billing report"
          description="It may not exist, or you may not have access to it."
          action={
            <Link to={ROUTES.REPORTS_BILLING_REPORTS} className={BACK_LINK_CLASSES}>
              Back to billing reports
            </Link>
          }
        />
      )}

      {!isLoading && error === undefined && billingReport !== undefined && (
        <>
          <PageHeader
            title={`${formatDate(billingReport.periodStart as string)} – ${formatDate(billingReport.periodEnd as string)}`}
            description={`Generated ${new Date(billingReport.generatedAt as string).toLocaleString()}`}
            action={
              <div className="flex gap-2">
                {canFinalize && (
                  <Button onClick={() => setIsConfirmingFinalize(true)}>Finalize</Button>
                )}
                {canMarkPaidOut && (
                  <Button onClick={() => setIsConfirmingPaidOut(true)}>Mark paid out</Button>
                )}
              </div>
            }
          />
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <BillingReportStatusBadge status={billingReport.status} />
                <span className="text-fg-muted text-sm">
                  Gross revenue: ${billingReport.grossRevenue}
                </span>
                <span className="text-fg-muted text-sm">
                  Commission: ${billingReport.commissionAmount}
                </span>
                <span className="text-fg-muted text-sm">
                  Net payout: ${billingReport.netPayout}
                </span>
              </div>
            </CardContent>
          </Card>

          {canViewReports && (
            <>
              <Dialog
                open={isConfirmingFinalize}
                onOpenChange={setIsConfirmingFinalize}
                title="Finalize this billing report?"
                description="The report will be locked and ready for payout. This cannot be undone."
                confirmLabel="Finalize"
                isConfirming={isFinalizing}
                onConfirm={() =>
                  void finalizeBillingReport({ variables: { id: billingReport.id } })
                }
              />
              <Dialog
                open={isConfirmingPaidOut}
                onOpenChange={setIsConfirmingPaidOut}
                title="Mark this billing report paid out?"
                description="The report will be marked as paid out. This cannot be undone."
                confirmLabel="Mark paid out"
                isConfirming={isMarkingPaidOut}
                onConfirm={() =>
                  void markBillingReportPaidOut({ variables: { id: billingReport.id } })
                }
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
