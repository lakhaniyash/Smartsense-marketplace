import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('formats a currency value', () => {
    render(<KpiCard label="Gross revenue" value={125430.5} format="currency" />)

    expect(screen.getByText('$125,430.50')).toBeInTheDocument()
  })

  it('formats a percent value', () => {
    render(<KpiCard label="Fulfilment rate" value={98.6} format="percent" />)

    expect(screen.getByText('98.6%')).toBeInTheDocument()
  })

  it('formats a count value with grouping', () => {
    render(<KpiCard label="Total orders" value={12045} format="count" />)

    expect(screen.getByText('12,045')).toBeInTheDocument()
  })

  it('renders a pre-formatted string value unchanged, regardless of format', () => {
    render(<KpiCard label="Status" value="N/A" format="currency" />)

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('colors an "up" trend as success and shows its delta', () => {
    render(
      <KpiCard
        label="Revenue"
        value={1000}
        trend={{ direction: 'up', value: 12.4, label: 'vs last period' }}
      />,
    )

    // The trend row is the <p> ancestor carrying the color class - the text
    // itself lives in a plain child <span>, per the component's own markup.
    const trendRow = screen.getByText('+12.4%').closest('p')
    expect(trendRow).toHaveClass('text-success')
    expect(screen.getByText('vs last period')).toBeInTheDocument()
  })

  it('colors a "down" trend as danger', () => {
    render(<KpiCard label="Revenue" value={1000} trend={{ direction: 'down', value: 5 }} />)

    expect(screen.getByText('-5%').closest('p')).toHaveClass('text-danger')
  })

  it('colors a "flat" trend as muted', () => {
    render(<KpiCard label="Revenue" value={1000} trend={{ direction: 'flat', value: 0 }} />)

    expect(screen.getByText('0%').closest('p')).toHaveClass('text-fg-muted')
  })

  it('renders KpiCardSkeleton instead of real content when isLoading', () => {
    render(<KpiCard label="Revenue" value={1000} isLoading />)

    expect(screen.queryByText('Revenue')).not.toBeInTheDocument()
    expect(screen.queryByText('1,000')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <KpiCard label="Revenue" value={1000} trend={{ direction: 'up', value: 4 }} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
