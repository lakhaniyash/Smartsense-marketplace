import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { ToastProvider, useToast } from './ToastProvider'

const meta: Meta = {
  title: 'UI/Toast',
}

export default meta
type Story = StoryObj

function TriggerToast() {
  const { toast } = useToast()
  return (
    <Button
      onClick={() =>
        toast({ title: 'Order saved', description: 'Order #1234 was updated.', variant: 'success' })
      }
    >
      Save order
    </Button>
  )
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <TriggerToast />
    </ToastProvider>
  ),
}
