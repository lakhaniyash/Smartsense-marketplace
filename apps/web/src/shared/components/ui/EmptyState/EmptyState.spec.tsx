import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the headline, description, and action', () => {
    render(
      <EmptyState
        title="No orders yet"
        description="Orders placed by your customers will show up here."
        action={<button type="button">Create Order</button>}
      />,
    )

    expect(screen.getByText('No orders yet')).toBeInTheDocument()
    expect(
      screen.getByText('Orders placed by your customers will show up here.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Order' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<EmptyState title="No orders yet" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
