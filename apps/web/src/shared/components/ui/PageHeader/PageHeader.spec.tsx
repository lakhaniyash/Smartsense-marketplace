import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders the title, description, and primary action', () => {
    render(
      <PageHeader
        title="Orders"
        description="All orders placed by your customers"
        action={<button type="button">Create Order</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(screen.getByText('All orders placed by your customers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Order' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PageHeader title="Orders" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
