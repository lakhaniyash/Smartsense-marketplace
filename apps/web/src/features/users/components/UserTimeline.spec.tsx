import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserTimeline } from './UserTimeline'

describe('UserTimeline', () => {
  it('renders the empty state when there are no entries', () => {
    render(<UserTimeline entries={[]} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('maps a known action to its human label', () => {
    render(
      <UserTimeline
        entries={[
          {
            id: 'log-1',
            action: 'USER_ROLE_ASSIGNED',
            occurredAt: '2026-01-02T00:00:00.000Z',
            actorName: 'Test Admin',
          },
        ]}
      />,
    )
    expect(screen.getByText('Role assigned')).toBeInTheDocument()
  })

  it('falls back to the raw action for an unknown action', () => {
    render(
      <UserTimeline
        entries={[
          {
            id: 'log-2',
            action: 'SOMETHING_NEW',
            occurredAt: '2026-01-02T00:00:00.000Z',
            actorName: 'Test Admin',
          },
        ]}
      />,
    )
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument()
  })
})
