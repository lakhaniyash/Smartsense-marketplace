import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { RevenuePlaceholderCard } from './RevenuePlaceholderCard'

describe('RevenuePlaceholderCard', () => {
  it('renders the label and a coming-soon badge, with no numeric value', () => {
    render(<RevenuePlaceholderCard />)

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<RevenuePlaceholderCard />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
