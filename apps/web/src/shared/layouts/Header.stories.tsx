import type { Meta, StoryObj } from '@storybook/react-vite'
import { Header } from './Header'

const meta: Meta<typeof Header> = {
  title: 'Layouts/Header',
  component: Header,
  args: {
    title: 'SmartSense Marketplace',
    subtitle: 'Admin Console',
    userLabel: 'yash.lakhani@smartsensesolutions.com',
    userInitials: 'YL',
    onLogout: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {}
