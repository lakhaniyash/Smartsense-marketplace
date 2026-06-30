export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet'

export interface BillingFilters {
  search?: string
  status?: InvoiceStatus
  dateFrom?: string
  dateTo?: string
}
