import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { InvoiceFilterBar } from './InvoiceFilterBar'

describe('InvoiceFilterBar', () => {
  it('keeps an accessible name for the Status filter without a visible label', () => {
    render(<InvoiceFilterBar status={undefined} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<InvoiceFilterBar status={undefined} onStatusChange={vi.fn()} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
