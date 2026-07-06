import { Card, CardContent } from '@shared/components'
import type { DashboardStatCard as DashboardStatCardModel } from '../types'

interface DashboardStatCardProps {
  card: DashboardStatCardModel
}

export function DashboardStatCard({ card }: DashboardStatCardProps) {
  const Icon = card.icon

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="rounded-md bg-gray-100 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {card.value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
