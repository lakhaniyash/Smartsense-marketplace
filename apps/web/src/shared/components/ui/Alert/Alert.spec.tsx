import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders its title and message', () => {
    render(
      <Alert variant="warning" title="Approval pending">
        This partner account is awaiting admin approval.
      </Alert>,
    )

    expect(screen.getByText('Approval pending')).toBeInTheDocument()
    expect(screen.getByText('This partner account is awaiting admin approval.')).toBeInTheDocument()
  })

  it('uses an assertive role for danger alerts and a polite one otherwise', () => {
    const { rerender } = render(<Alert variant="danger">Failed</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<Alert variant="info">Heads up</Alert>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Alert title="Heads up">Some info</Alert>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
