import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { UserFilterBar } from './UserFilterBar'

function renderBar() {
  return render(
    <UserFilterBar
      search={undefined}
      status={undefined}
      ownerType={undefined}
      onSearchChange={vi.fn()}
      onStatusChange={vi.fn()}
      onOwnerTypeChange={vi.fn()}
    />,
  )
}

describe('UserFilterBar', () => {
  it('keeps accessible names for Search, Status, and Owner type without visible labels', () => {
    renderBar()

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Owner type' })).toBeInTheDocument()
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderBar()

    expect(await axe(container)).toHaveNoViolations()
  })
})
