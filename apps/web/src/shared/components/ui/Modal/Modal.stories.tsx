import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button'
import { Modal } from './Modal'

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open modal</Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Edit shipping address"
            description="Update the address this order ships to."
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Save</Button>
              </>
            }
          >
            Form fields go here.
          </Modal>
        </>
      )
    }
    return <Example />
  },
}
