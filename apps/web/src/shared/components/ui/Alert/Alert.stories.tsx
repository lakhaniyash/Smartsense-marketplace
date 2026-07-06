import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  args: { title: 'Approval pending', children: 'This partner account is awaiting admin approval.' },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Info: Story = { args: { variant: 'info' } }
export const Success: Story = {
  args: { variant: 'success', title: 'Saved', children: 'Your changes have been saved.' },
}
export const Warning: Story = { args: { variant: 'warning' } }
export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Payment failed',
    children: 'We could not process this order.',
  },
}
