import type { Meta, StoryObj } from '@storybook/react-vite'
import { UserMenu } from './UserMenu'

const meta: Meta<typeof UserMenu> = {
  title: 'UI/UserMenu',
  component: UserMenu,
  args: {
    userLabel: 'yash.lakhani+admin@smartsensesolutions.com',
    userInitials: 'YL',
    roleLabel: 'Admin Console',
  },
}

export default meta
type Story = StoryObj<typeof UserMenu>

export const Default: Story = {
  render: (args) => (
    <div className="w-56">
      <UserMenu {...args} />
    </div>
  ),
}
export const Collapsed: Story = {
  render: (args) => (
    <div className="w-16">
      <UserMenu {...args} collapsed />
    </div>
  ),
}
