import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  args: { label: 'Email', placeholder: 'you@example.com' },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}
export const WithHelperText: Story = { args: { helperText: 'We never share this' } }
export const WithError: Story = { args: { error: 'Email is required' } }
export const Disabled: Story = {
  args: { disabled: true, value: 'yash.lakhani@smartsensesolutions.com' },
}
export const Required: Story = { args: { required: true } }
