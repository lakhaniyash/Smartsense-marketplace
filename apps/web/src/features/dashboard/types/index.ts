import type { ComponentType, SVGProps } from 'react'

export type DashboardIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface DashboardStatCard {
  key: string
  label: string
  value: number
  icon: DashboardIcon
  permission: string
}

export interface DashboardQuickAction {
  key: string
  label: string
  href: string
  icon: DashboardIcon
  permission: string
}
