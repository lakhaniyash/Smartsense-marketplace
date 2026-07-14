import type { ApolloError } from '@apollo/client'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { CustomerActivityTab } from './CustomerActivityTab'

const ENTRY = {
  id: 'log-1',
  action: 'CUSTOMER_CREATED',
  occurredAt: '2026-07-01T00:00:00.000Z',
  actorName: 'Jordan Rivera',
}

describe('CustomerActivityTab', () => {
  it('renders a real error state instead of the empty state when the query fails', () => {
    render(
      <CustomerActivityTab
        entries={[]}
        isLoading={false}
        error={{} as ApolloError}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText("Couldn't load activity")).toBeInTheDocument()
    expect(screen.queryByText('No activity yet')).not.toBeInTheDocument()
  })

  it("calls onRetry when the error state's retry button is clicked", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <CustomerActivityTab
        entries={[]}
        isLoading={false}
        error={{} as ApolloError}
        onRetry={onRetry}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('delegates to CustomerTimeline when there is no error', () => {
    render(
      <CustomerActivityTab
        entries={[ENTRY]}
        isLoading={false}
        error={undefined}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Customer created')).toBeInTheDocument()
  })

  it('renders the empty state only when there is no error and no entries', () => {
    render(
      <CustomerActivityTab entries={[]} isLoading={false} error={undefined} onRetry={vi.fn()} />,
    )

    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('has no accessibility violations in the error state', async () => {
    const { container } = render(
      <CustomerActivityTab
        entries={[]}
        isLoading={false}
        error={{} as ApolloError}
        onRetry={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
