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
        <div className="bg-surface-hover text-fg-muted rounded-lg p-3">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-fg-muted text-xs font-medium tracking-wide uppercase">{card.label}</p>
          <p className="text-fg-default text-3xl font-semibold tracking-tight">
            {card.value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
