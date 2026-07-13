import { BillingReportStatus } from '@lib/graphql/__generated__/graphql'
import { Badge, type BadgeVariant } from '@shared/components'

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

export function BillingReportStatusBadge({ status }: BillingReportStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
