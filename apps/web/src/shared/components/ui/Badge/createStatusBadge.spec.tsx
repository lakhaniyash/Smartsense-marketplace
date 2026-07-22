import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BadgeVariant } from './Badge'
import { createStatusBadge } from './createStatusBadge'

enum FakeStatus {
  Open = 'OPEN',
  Closed = 'CLOSED',
}

const VARIANT: Record<FakeStatus, BadgeVariant> = {
  [FakeStatus.Open]: 'success',
  [FakeStatus.Closed]: 'danger',
}

const LABEL: Record<FakeStatus, string> = {
  [FakeStatus.Open]: 'Open',
  [FakeStatus.Closed]: 'Closed',
}

describe('createStatusBadge', () => {
  const StatusBadge = createStatusBadge(VARIANT, LABEL)

  it('renders the mapped label for the given status', () => {
    render(<StatusBadge status={FakeStatus.Open} />)

    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('applies the mapped variant classes for the given status', () => {
    render(<StatusBadge status={FakeStatus.Closed} />)

    const badge = screen.getByText('Closed')
    // `danger` variant maps to the shared Badge's danger token classes.
    expect(badge).toHaveClass('bg-danger-subtle', 'text-danger-emphasis')
  })
})
