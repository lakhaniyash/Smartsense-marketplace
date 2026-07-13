import type { Meta, StoryObj } from '@storybook/react-vite'
import { RevenueIcon } from '@shared/icons'
import { KpiCard } from './KpiCard'

const meta: Meta<typeof KpiCard> = {
  title: 'UI/KpiCard',
  component: KpiCard,
}

export default meta
type Story = StoryObj<typeof KpiCard>

export const Currency: Story = {
  args: {
    label: 'Gross revenue',
    value: 125430.5,
    format: 'currency',
    icon: <RevenueIcon className="size-5" />,
    trend: { direction: 'up', value: 12.4, label: 'vs last period' },
  },
}

export const Percent: Story = {
  args: {
    label: 'Fulfilment rate',
    value: 98.6,
    format: 'percent',
    trend: { direction: 'flat', value: 0, label: 'vs last period' },
  },
}

export const Count: Story = {
  args: {
    label: 'Total orders',
    value: 12045,
    format: 'count',
    trend: { direction: 'down', value: 3.1, label: 'vs last period' },
  },
}

export const NoTrend: Story = {
  args: {
    label: 'Active SKUs',
    value: 842,
    format: 'count',
  },
}

export const Loading: Story = {
  args: {
    label: 'Gross revenue',
    value: 0,
    isLoading: true,
  },
}
