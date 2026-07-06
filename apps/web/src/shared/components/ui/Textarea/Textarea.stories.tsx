import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  args: { label: 'Notes', placeholder: 'Add a note...' },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}
export const WithHelperText: Story = { args: { helperText: 'Visible to your team only' } }
export const WithError: Story = { args: { error: 'Notes are required' } }
export const Disabled: Story = { args: { disabled: true, value: 'Ships next week' } }
