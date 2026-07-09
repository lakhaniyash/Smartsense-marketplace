import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotificationsMenu } from './NotificationsMenu'

const meta: Meta<typeof NotificationsMenu> = {
  title: 'UI/NotificationsMenu',
  component: NotificationsMenu,
}

export default meta
type Story = StoryObj<typeof NotificationsMenu>

export const Default: Story = {}
