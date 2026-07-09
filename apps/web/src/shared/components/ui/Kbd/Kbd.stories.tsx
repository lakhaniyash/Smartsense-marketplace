import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'

const meta: Meta<typeof Kbd> = {
  title: 'UI/Kbd',
  component: Kbd,
  args: { children: 'Ctrl K' },
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}
