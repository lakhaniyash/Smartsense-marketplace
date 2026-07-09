import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { Breadcrumb } from './Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    items: [{ label: 'Orders', href: '/orders' }, { label: 'Order #1234' }],
  },
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {}
