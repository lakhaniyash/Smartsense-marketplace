import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  it('shows identity in the row itself when expanded, and logs out on selecting Log out', async () => {
    const onLogout = vi.fn()
    render(
      <UserMenu
        userLabel="yash.lakhani+admin@smartsensesolutions.com"
        userInitials="YL"
        roleLabel="Admin Console"
        onLogout={onLogout}
      />,
    )

    // Expanded (default) mode shows identity in the trigger row itself, not
    // only inside the opened menu — visible before any click.
    expect(screen.getByText('yash.lakhani+admin@smartsensesolutions.com')).toBeInTheDocument()
    expect(screen.getByText('Admin Console')).toBeInTheDocument()

    const trigger = screen.getByRole('button', {
      name: 'Account menu for yash.lakhani+admin@smartsensesolutions.com',
    })
    await userEvent.click(trigger)

    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('yash.lakhani+admin@smartsensesolutions.com')).toBeInTheDocument()

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('collapses to an icon-only trigger with no visible identity text, when collapsed', () => {
    render(
      <UserMenu
        userLabel="yash.lakhani+admin@smartsensesolutions.com"
        userInitials="YL"
        roleLabel="Admin Console"
        onLogout={vi.fn()}
        collapsed
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Account menu for yash.lakhani+admin@smartsensesolutions.com',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('yash.lakhani+admin@smartsensesolutions.com')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument()
  })

  it('has no accessibility violations when open', async () => {
    const { container } = render(
      <UserMenu
        userLabel="yash.lakhani+admin@smartsensesolutions.com"
        userInitials="YL"
        onLogout={vi.fn()}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Account menu for yash.lakhani+admin@smartsensesolutions.com',
      }),
    )
    await screen.findByRole('menuitem', { name: 'Log out' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
