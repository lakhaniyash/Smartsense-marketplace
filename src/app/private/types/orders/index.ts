export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderFilters {
  search?: string
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
}
