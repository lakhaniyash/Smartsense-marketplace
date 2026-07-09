import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'

const meta: Meta<typeof Sidebar> = {
  title: 'Layouts/Sidebar',
  component: Sidebar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Catalog', href: '/catalog' },
      { label: 'Orders', href: '/orders' },
      { label: 'Billing', href: '/billing' },
    ],
    userLabel: 'yash.lakhani+admin@smartsensesolutions.com',
    userInitials: 'YL',
    roleLabel: 'Admin Console',
    onLogout: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Default: Story = {}
export const Collapsed: Story = { args: { collapsed: true } }
