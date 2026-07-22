import { BillingReportStatus } from '@lib/graphql/__generated__/graphql'
import { type BadgeVariant, createStatusBadge } from '@shared/components'

// Covers every BillingReportStatus value the schema exposes
// (docs/domain-model.md § Billing Report lifecycle: GENERATED -> FINALIZED ->
// PAID_OUT), mirroring InvoiceStatusBadge's shape exactly.
const STATUS_VARIANT: Record<BillingReportStatus, BadgeVariant> = {
  [BillingReportStatus.Generated]: 'neutral',
  [BillingReportStatus.Finalized]: 'warning',
  [BillingReportStatus.PaidOut]: 'success',
}

const STATUS_LABEL: Record<BillingReportStatus, string> = {
  [BillingReportStatus.Generated]: 'Generated',
  [BillingReportStatus.Finalized]: 'Finalized',
  [BillingReportStatus.PaidOut]: 'Paid out',
}

export interface BillingReportStatusBadgeProps {
  status: BillingReportStatus
}

export const BillingReportStatusBadge = createStatusBadge(STATUS_VARIANT, STATUS_LABEL)
