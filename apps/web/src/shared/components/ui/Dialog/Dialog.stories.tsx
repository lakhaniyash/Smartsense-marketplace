import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button'
import { Dialog } from './Dialog'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Confirmation: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button variant="danger" onClick={() => setOpen(true)}>
            Delete order
          </Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Delete order #1234"
            description="This action cannot be undone."
            variant="danger"
            confirmLabel="Delete"
            onConfirm={() => setOpen(false)}
          />
        </>
      )
    }
    return <Example />
  },
}
