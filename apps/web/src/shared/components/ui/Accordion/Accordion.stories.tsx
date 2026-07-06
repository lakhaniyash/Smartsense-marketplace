import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion } from './Accordion'

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  args: {
    items: [
      { value: 'shipping', trigger: 'Shipping address', content: '123 Main St, Ahmedabad' },
      { value: 'billing', trigger: 'Billing address', content: '456 Side St, Ahmedabad' },
    ],
  },
}

export default meta
type Story = StoryObj<typeof Accordion>

export const Single: Story = {}
export const Multiple: Story = { args: { type: 'multiple' } }
