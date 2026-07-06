import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('announces itself via an accessible status region', () => {
    render(<Spinner label="Refreshing orders" />)

    expect(screen.getByRole('status', { name: 'Refreshing orders' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Spinner />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
