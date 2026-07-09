import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { DashboardIcon, OrdersIcon } from '@shared/icons'
import { Button } from '../Button'
import { ThemeProvider } from '../ThemeToggle'
import { CommandPalette } from './CommandPalette'

const meta: Meta<typeof CommandPalette> = {
  title: 'UI/CommandPalette',
  component: CommandPalette,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof CommandPalette>

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon className="size-4" /> },
  { label: 'Orders', href: '/orders', icon: <OrdersIcon className="size-4" /> },
]

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open command palette (or press Ctrl/Cmd+K)</Button>
          <CommandPalette open={open} onOpenChange={setOpen} navItems={navItems} />
        </>
      )
    }
    return <Demo />
  },
}
