import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chart } from './Chart'

const meta: Meta<typeof Chart> = {
  title: 'UI/Chart',
  component: Chart,
  args: {
    height: 280,
  },
}

export default meta
type Story = StoryObj<typeof Chart>

export const Line: Story = {
  args: {
    type: 'line',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ label: 'Revenue', data: [1200, 1900, 1500, 2200, 2600, 1800, 2100] }],
    ariaLabel: 'Revenue trend, last 7 days',
  },
}

export const MultiSeriesLine: Story = {
  args: {
    type: 'line',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { label: 'This period', data: [4000, 4500, 4200, 5100], colorRole: 'primary' },
      { label: 'Previous period', data: [3500, 3800, 3900, 4200], colorRole: 'secondary' },
    ],
    ariaLabel: 'Revenue trend compared to previous period',
  },
}

export const Bar: Story = {
  args: {
    type: 'bar',
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [{ label: 'Orders', data: [12, 8, 20, 45, 3] }],
    ariaLabel: 'Orders by status',
  },
}

export const Doughnut: Story = {
  args: {
    type: 'doughnut',
    labels: ['In stock', 'Low stock', 'Out of stock'],
    datasets: [{ label: 'Inventory', data: [64, 12, 4] }],
    ariaLabel: 'Inventory status breakdown',
  },
}

export const Empty: Story = {
  args: {
    type: 'line',
    labels: [],
    datasets: [],
    ariaLabel: 'Revenue trend, last 7 days',
    isEmpty: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `isEmpty` is true, the shared EmptyState renders instead of Chart.js mounting an empty axes grid, which would read as broken rather than "no data".',
      },
    },
  },
}
