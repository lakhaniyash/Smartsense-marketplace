import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { ErrorState } from './ErrorState'

const meta: Meta<typeof ErrorState> = {
  title: 'UI/ErrorState',
  component: ErrorState,
}

export default meta
type Story = StoryObj<typeof ErrorState>

export const Default: Story = {}
export const WithRetry: Story = {
  args: {
    title: 'Could not load orders',
    description: 'Check your connection and try again.',
    action: <Button size="sm">Retry</Button>,
  },
}
