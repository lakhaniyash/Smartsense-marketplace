import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Breadcrumb } from './Breadcrumb'

const items = [{ label: 'Orders', href: '/orders' }, { label: 'Order #1234' }]

describe('Breadcrumb', () => {
  it('links every item except the current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/orders')
    expect(screen.getByText('Order #1234')).toHaveAttribute('aria-current', 'page')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
