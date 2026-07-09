import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { NotificationsMenu } from './NotificationsMenu'

describe('NotificationsMenu', () => {
  it('shows an honest placeholder — never a fake unread count or sample data', async () => {
    render(<NotificationsMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('No notifications yet')).toBeInTheDocument()
    expect(screen.getByText(/aren't available yet/)).toBeInTheDocument()
  })

  it('has no accessibility violations when open', async () => {
    const { container } = render(<NotificationsMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await screen.findByText('No notifications yet')
    expect(await axe(container)).toHaveNoViolations()
  })
})
