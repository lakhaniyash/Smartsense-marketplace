import type { Customer } from '@lib/graphql/__generated__/graphql'
import { Card, CardContent } from '@shared/components'
import { CustomerStatusBadge } from './CustomerStatusBadge'

export interface CustomerDetailsCardProps {
  customer: Pick<Customer, 'status' | 'type' | 'billingSummary'>
}

// The Details tab on the Customer detail page — status/type plus the
// billing summary, which is only populated by customerById (never the
// customers list), per CustomerBillingSummary's own doc comment.
export function CustomerDetailsCard({ customer }: CustomerDetailsCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CustomerStatusBadge status={customer.status} />
          <span className="text-fg-muted text-sm">
            {customer.type === 'INDIVIDUAL' ? 'Individual' : 'Organization'}
          </span>
        </div>
        {customer.billingSummary !== null && customer.billingSummary !== undefined && (
          <div className="border-border-default flex flex-wrap gap-6 border-t pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-fg-muted text-xs font-medium">Total orders</span>
              <span className="text-fg-default text-lg font-semibold">
                {customer.billingSummary.totalOrders}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-fg-muted text-xs font-medium">Total invoiced</span>
              <span className="text-fg-default text-lg font-semibold">
                ${customer.billingSummary.totalInvoiced}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-fg-muted text-xs font-medium">Outstanding</span>
              <span className="text-fg-default text-lg font-semibold">
                ${customer.billingSummary.totalOutstanding}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
