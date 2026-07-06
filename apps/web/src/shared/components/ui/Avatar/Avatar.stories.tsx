import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  args: { initials: 'YL' },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Initials: Story = {}
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar initials="YL" size="sm" />
      <Avatar initials="YL" size="md" />
      <Avatar initials="YL" size="lg" />
    </div>
  ),
}
