import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { RecentActivity } from './RecentActivity'

describe('RecentActivity', () => {
  it('renders the placeholder empty state', () => {
    render(<RecentActivity />)

    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument()
    expect(screen.getByText('No recent activity yet')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<RecentActivity />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
