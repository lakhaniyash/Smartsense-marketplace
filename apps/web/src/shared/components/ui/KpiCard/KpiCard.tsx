import type { ReactNode } from 'react'
import { TrendDownIcon, TrendFlatIcon, TrendUpIcon } from '@shared/icons'
import { Card, CardContent } from '../Card'
import { KpiCardSkeleton } from './KpiCardSkeleton'

export type KpiCardFormat = 'currency' | 'percent' | 'count' | 'decimal'

export interface KpiCardTrend {
  direction: 'up' | 'down' | 'flat'
  // A percentage delta (e.g. 12.4 renders as "+12.4%") - always relative,
  // never a second absolute value, per how every other KPI trend in the app
  // is expressed.
  value: number
  label?: string
}

export interface KpiCardProps {
  label: string
  value: number | string
  format?: KpiCardFormat
  icon?: ReactNode
  // This component is domain-agnostic about whether "up" is good or bad for
  // a given metric (e.g. up is good for Revenue, bad for Return Rate) - the
  // caller decides which `direction` to pass; KpiCard only ever colors `up`
  // as success and `down` as danger.
  trend?: KpiCardTrend
  isLoading?: boolean
}

function formatValue(value: number | string, format: KpiCardFormat): string {
  if (typeof value === 'string') {
    return value
  }

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
    case 'decimal':
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    case 'count':
    default:
      return value.toLocaleString()
  }
}

// The sign is derived from `direction`, not from the sign of `trend.value` -
// callers pass the magnitude of the change; whether that magnitude reads as
// an increase or a decrease is `direction`'s job, so a "down" trend never
// renders with a stray leading "+".
function formatTrendValue(trend: KpiCardTrend): string {
  const magnitude = Math.abs(trend.value).toLocaleString(undefined, { maximumFractionDigits: 1 })
  const sign = trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''
  return `${sign}${magnitude}%`
}

const TREND_ICON = {
  up: TrendUpIcon,
  down: TrendDownIcon,
  flat: TrendFlatIcon,
} as const

const TREND_COLOR_CLASS: Record<KpiCardTrend['direction'], string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-fg-muted',
}

// New shared component, not a fork of the feature-local
// features/dashboard/components/DashboardStatCard.tsx (M11) - Reports needs
// trend deltas and format variants that card doesn't have, so it's left
// untouched (M15 plan § Architectural Decisions). Built from the existing
// Card/CardContent primitives for visual consistency with the rest of the
// app, same as DashboardStatCard is.
export function KpiCard({
  label,
  value,
  format = 'count',
  icon,
  trend,
  isLoading = false,
}: KpiCardProps) {
  if (isLoading) {
    return <KpiCardSkeleton />
  }

  const TrendIcon = trend !== undefined ? TREND_ICON[trend.direction] : undefined

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        {icon !== undefined && (
          <div className="bg-surface-hover text-fg-muted rounded-lg p-3" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-fg-muted text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className="text-fg-default text-3xl font-semibold tracking-tight">
            {formatValue(value, format)}
          </p>
          {trend !== undefined && TrendIcon !== undefined && (
            <p
              className={`flex items-center gap-1 text-sm font-medium ${TREND_COLOR_CLASS[trend.direction]}`}
            >
              <TrendIcon className="size-4" aria-hidden="true" />
              <span>{formatTrendValue(trend)}</span>
              {trend.label !== undefined && (
                <span className="text-fg-muted font-normal">{trend.label}</span>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
