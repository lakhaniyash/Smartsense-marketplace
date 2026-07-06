import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthLayout } from './AuthLayout'

const meta: Meta<typeof AuthLayout> = {
  title: 'Layouts/AuthLayout',
  component: AuthLayout,
}

export default meta
type Story = StoryObj<typeof AuthLayout>

export const Default: Story = {
  args: {
    children: <p className="text-center text-sm text-gray-500">Redirecting to sign in…</p>,
    footer: <p>&copy; SmartSense Marketplace</p>,
  },
}
