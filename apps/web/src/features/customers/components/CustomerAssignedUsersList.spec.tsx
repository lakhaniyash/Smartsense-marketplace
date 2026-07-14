import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserStatus } from '@lib/graphql/__generated__/graphql'
import { CustomerAssignedUsersList } from './CustomerAssignedUsersList'

describe('CustomerAssignedUsersList', () => {
  it('renders the empty state when there are no assigned users', () => {
    render(<CustomerAssignedUsersList assignedUsers={[]} />)

    expect(screen.getByText('No assigned users')).toBeInTheDocument()
  })

  it('renders a row per assigned user', () => {
    render(
      <CustomerAssignedUsersList
        assignedUsers={[
          {
            id: 'user-1',
            fullName: 'Jordan Rivera',
            email: 'jordan@example.com',
            status: UserStatus.Active,
          },
        ]}
      />,
    )

    expect(screen.getByText('Jordan Rivera')).toBeInTheDocument()
    expect(screen.getByText('jordan@example.com')).toBeInTheDocument()
    expect(screen.queryByText('No assigned users')).not.toBeInTheDocument()
  })
})
