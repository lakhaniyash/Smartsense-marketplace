import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { ReportFilterBar } from './ReportFilterBar'

describe('ReportFilterBar', () => {
  it('renders the date range control', () => {
    render(
      <ReportFilterBar
        dateRange={{ from: undefined, to: undefined }}
        onDateRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Date range' })).toBeInTheDocument()
  })

  it('renders a page-specific extra filter when provided', () => {
    render(
      <ReportFilterBar
        dateRange={{ from: undefined, to: undefined }}
        onDateRangeChange={vi.fn()}
        extraFilters={<span>Extra filter</span>}
      />,
    )

    expect(screen.getByText('Extra filter')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ReportFilterBar
        dateRange={{ from: undefined, to: undefined }}
        onDateRangeChange={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
