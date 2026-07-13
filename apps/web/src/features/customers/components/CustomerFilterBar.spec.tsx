import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { CustomerFilterBar } from './CustomerFilterBar'

describe('CustomerFilterBar', () => {
  it('keeps an accessible name for Search and Status without a visible label', () => {
    render(
      <CustomerFilterBar
        search={undefined}
        status={undefined}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CustomerFilterBar
        search={undefined}
        status={undefined}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
