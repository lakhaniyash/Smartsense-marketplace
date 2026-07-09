import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../ThemeToggle'
import { CommandPalette, type CommandPaletteNavItem } from './CommandPalette'

const navItems: CommandPaletteNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Orders', href: '/orders' },
]

function Harness({ onLogout }: { onLogout?: (() => void) | undefined }) {
  const [open, setOpen] = useState(true)
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            navItems={navItems}
            onLogout={onLogout}
          />
        }
      />
      <Route path="/orders" element={<p>Orders page</p>} />
    </Routes>
  )
}

function renderPalette(onLogout?: () => void) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ThemeProvider>
        <Harness onLogout={onLogout} />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('CommandPalette', () => {
  it('navigates to the selected page and closes', async () => {
    renderPalette()

    expect(screen.getByRole('option', { name: 'Orders' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: 'Orders' }))

    expect(await screen.findByText('Orders page')).toBeInTheDocument()
  })

  it('switches the theme when a theme action is selected', async () => {
    renderPalette()

    await userEvent.click(screen.getByRole('option', { name: 'Switch to dark theme' }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('calls onLogout when the Log out action is selected', async () => {
    const onLogout = vi.fn()
    renderPalette(onLogout)

    await userEvent.click(screen.getByRole('option', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('opens on Ctrl+K and closes on Escape', async () => {
    function ToggleHarness() {
      const [open, setOpen] = useState(false)
      return <CommandPalette open={open} onOpenChange={setOpen} navItems={navItems} />
    }
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ToggleHarness />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('option', { name: 'Dashboard' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(await screen.findByRole('option', { name: 'Dashboard' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('option', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations when open', async () => {
    const { container } = renderPalette()
    expect(await axe(container)).toHaveNoViolations()
  })
})
