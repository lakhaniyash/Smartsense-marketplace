import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'partner', label: 'Partner' },
  { value: 'customer', label: 'Customer' },
]

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  args: { label: 'Role', options },
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {}
export const WithPlaceholder: Story = { args: { placeholder: 'Choose a role' } }
export const WithError: Story = { args: { error: 'Role is required' } }
export const Disabled: Story = { args: { disabled: true } }
