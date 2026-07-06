import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { PageHeader } from './PageHeader'

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  args: { title: 'Orders', description: 'All orders placed by your customers' },
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {}
export const WithAction: Story = {
  args: { action: <Button>Create Order</Button> },
}
