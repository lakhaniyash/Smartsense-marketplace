import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders default copy', () => {
    render(<ErrorState />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Please try again.')).toBeInTheDocument()
  })

  it('renders custom copy and a retry action', () => {
    render(
      <ErrorState
        title="Could not load orders"
        description="Check your connection and try again."
        action={<button type="button">Retry</button>}
      />,
    )

    expect(screen.getByText('Could not load orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ErrorState />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
