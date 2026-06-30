export type DashboardPeriod = 'day' | 'week' | 'month' | 'year'

export interface StatCard {
  label: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
}
