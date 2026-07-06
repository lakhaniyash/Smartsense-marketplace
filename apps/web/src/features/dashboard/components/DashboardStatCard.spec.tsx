import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ProductsIcon } from '@shared/icons'
import { DashboardStatCard } from './DashboardStatCard'

const CARD = {
  key: 'totalProducts',
  label: 'Total Products',
  value: 1280,
  icon: ProductsIcon,
  permission: 'catalog:read',
}

describe('DashboardStatCard', () => {
  it('renders the label and a formatted value', () => {
    render(<DashboardStatCard card={CARD} />)

    expect(screen.getByText('Total Products')).toBeInTheDocument()
    expect(screen.getByText('1,280')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DashboardStatCard card={CARD} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
