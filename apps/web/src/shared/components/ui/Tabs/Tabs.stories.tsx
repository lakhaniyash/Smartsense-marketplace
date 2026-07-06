import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  args: {
    items: [
      { value: 'details', label: 'Details', content: <p>Order details go here.</p> },
      { value: 'timeline', label: 'Timeline', content: <p>Order timeline goes here.</p> },
      { value: 'invoice', label: 'Invoice', content: <p>Invoice goes here.</p> },
    ],
  },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {}
