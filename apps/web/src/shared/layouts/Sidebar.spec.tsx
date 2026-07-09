import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'

const items = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Orders', href: '/orders' },
]

describe('Sidebar', () => {
  it('renders a link per item inside a labeled navigation landmark', () => {
    render(
      <MemoryRouter>
        <Sidebar items={items} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/orders')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar items={items} />
      </MemoryRouter>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('hides visible labels but keeps them accessible when collapsed', () => {
    render(
      <MemoryRouter>
        <Sidebar items={items} collapsed />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('calls onToggleCollapse when the collapse control is clicked', async () => {
    const onToggleCollapse = vi.fn()
    render(
      <MemoryRouter>
        <Sidebar items={items} onToggleCollapse={onToggleCollapse} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })

  it('renders the account footer and logs out on click, when identity props are given', async () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <Sidebar
          items={items}
          userLabel="yash.lakhani+admin@smartsensesolutions.com"
          userInitials="YL"
          roleLabel="Admin Console"
          onLogout={onLogout}
        />
      </MemoryRouter>,
    )

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Account menu for yash.lakhani+admin@smartsensesolutions.com',
      }),
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('omits the account footer entirely when identity props are not given', () => {
    render(
      <MemoryRouter>
        <Sidebar items={items} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: /Account menu for/ })).not.toBeInTheDocument()
  })
})
