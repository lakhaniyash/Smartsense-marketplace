import type { DashboardStatsQuery } from '@lib/graphql/__generated__/graphql'
import {
  QUICK_ACTION_DEFINITIONS,
  REVENUE_PLACEHOLDER_CARD,
  STAT_CARD_DEFINITIONS,
} from '../constants'
import type { DashboardQuickAction, DashboardStatCard } from '../types'

type DashboardStats = DashboardStatsQuery['dashboardStats']
type CanCheck = (permission: string) => boolean

// Pure view-model shaping, kept apart from useDashboard's Apollo lifecycle so
// the permission-filtering logic is testable without mocking a GraphQL client.
export function buildStatCards(stats: DashboardStats, can: CanCheck): DashboardStatCard[] {
  return STAT_CARD_DEFINITIONS.filter((definition) => can(definition.permission)).map(
    (definition) => ({
      key: definition.key,
      label: definition.label,
      permission: definition.permission,
      icon: definition.icon,
      value: stats[definition.key],
    }),
  )
}

export function buildQuickActions(can: CanCheck): DashboardQuickAction[] {
  return QUICK_ACTION_DEFINITIONS.filter((definition) => can(definition.permission))
}

export function canViewRevenuePlaceholder(can: CanCheck): boolean {
  return can(REVENUE_PLACEHOLDER_CARD.permission)
}
