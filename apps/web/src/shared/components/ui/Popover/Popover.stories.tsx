import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { Popover } from './Popover'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover trigger={<Button variant="secondary">Show info</Button>}>
      <p className="text-fg-secondary text-sm">
        Lightweight floating content anchored to its trigger — not a list of commands.
      </p>
    </Popover>
  ),
}
