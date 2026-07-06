import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
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
})
