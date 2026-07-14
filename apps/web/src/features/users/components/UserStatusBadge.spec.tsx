import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserStatus } from '@lib/graphql/__generated__/graphql'
import { UserStatusBadge } from './UserStatusBadge'

describe('UserStatusBadge', () => {
  it('renders a human label for every UserStatus value', () => {
    const cases: Array<[UserStatus, string]> = [
      [UserStatus.Active, 'Active'],
      [UserStatus.Invited, 'Invited'],
      [UserStatus.Suspended, 'Suspended'],
      [UserStatus.Deactivated, 'Deactivated'],
    ]

    for (const [status, label] of cases) {
      const { unmount } = render(<UserStatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })
})
