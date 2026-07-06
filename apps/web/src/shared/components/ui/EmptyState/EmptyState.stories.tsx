import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const NoData: Story = {
  args: {
    title: 'No orders yet',
    description: 'Orders placed by your customers will show up here.',
    action: <Button>Create Order</Button>,
  },
}

export const NoSearchResults: Story = {
  args: {
    title: "No results for 'blue shirt'",
    description: 'Try a different search term or clear your filters.',
    action: (
      <Button variant="secondary" size="sm">
        Clear filters
      </Button>
    ),
  },
}
