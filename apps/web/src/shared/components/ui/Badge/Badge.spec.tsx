import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Active</Badge>)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge variant="danger">Suspended</Badge>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
