import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button'
import { Drawer } from './Drawer'

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
}

export default meta
type Story = StoryObj<typeof Drawer>

export const Default: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>View order</Button>
          <Drawer
            open={open}
            onOpenChange={setOpen}
            title="Order #1234"
            description="Placed 2 days ago"
          >
            Order detail content goes here, including the item list, shipping address, and timeline.
          </Drawer>
        </>
      )
    }
    return <Example />
  },
}
