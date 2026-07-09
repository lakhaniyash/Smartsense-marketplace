import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'

describe('Menu', () => {
  it('opens on trigger click and shows its items', async () => {
    render(
      <Menu trigger={<button type="button">Open menu</button>}>
        <MenuLabel>Account</MenuLabel>
        <MenuSeparator />
        <MenuItem>Profile</MenuItem>
      </Menu>,
    )

    expect(screen.queryByRole('menuitem', { name: 'Profile' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument()
  })

  it('calls onSelect when an item is chosen', async () => {
    const onSelect = vi.fn()
    render(
      <Menu trigger={<button type="button">Open menu</button>}>
        <MenuItem onSelect={onSelect}>Log out</MenuItem>
      </Menu>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations when open', async () => {
    const { container } = render(
      <Menu trigger={<button type="button">Open menu</button>}>
        <MenuItem>Profile</MenuItem>
      </Menu>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await screen.findByRole('menuitem', { name: 'Profile' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
