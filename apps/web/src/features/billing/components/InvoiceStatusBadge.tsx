import { InvoiceStatus } from '@lib/graphql/__generated__/graphql'
import { Badge, type BadgeVariant } from '@shared/components'

// Covers every InvoiceStatus value the schema exposes
// (docs/domain-model.md § Invoice Lifecycle).
const STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  [InvoiceStatus.Draft]: 'neutral',
  [InvoiceStatus.Issued]: 'info',
  [InvoiceStatus.PartiallyPaid]: 'warning',
  [InvoiceStatus.Paid]: 'success',
  [InvoiceStatus.Void]: 'danger',
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'Draft',
  [InvoiceStatus.Issued]: 'Issued',
  [InvoiceStatus.PartiallyPaid]: 'Partially paid',
  [InvoiceStatus.Paid]: 'Paid',
  [InvoiceStatus.Void]: 'Void',
}

export interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
