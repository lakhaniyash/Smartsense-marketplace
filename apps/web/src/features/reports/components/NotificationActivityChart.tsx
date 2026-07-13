import type { GetNotificationActivityReportQuery } from '@lib/graphql/__generated__/graphql'
import { Chart } from '@shared/components'
import { formatEnumLabel } from './formatEnumLabel'

export type NotificationTypeBreakdown =
  GetNotificationActivityReportQuery['notificationActivityReport']['typeBreakdown'][number]

export interface NotificationActivityChartProps {
  typeBreakdown: NotificationTypeBreakdown[]
}

export function NotificationActivityChart({ typeBreakdown }: NotificationActivityChartProps) {
  const labels = typeBreakdown.map((entry) => formatEnumLabel(entry.type))
  const data = typeBreakdown.map((entry) => entry.count)

  return (
    <Chart
      type="doughnut"
      labels={labels}
      datasets={[{ label: 'Notifications', data }]}
      ariaLabel="Notification volume by type"
      isEmpty={data.every((count) => count === 0)}
    />
  )
}
