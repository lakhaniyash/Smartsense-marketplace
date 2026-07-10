import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { NotificationFilterBar } from './NotificationFilterBar'

describe('NotificationFilterBar', () => {
  it('keeps an accessible name for the Read status filter without a visible label', () => {
    render(<NotificationFilterBar readState="all" onReadStateChange={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Read status' })).toBeInTheDocument()
    expect(screen.queryByText('Read status')).not.toBeInTheDocument()
  })

  it('calls onReadStateChange with the selected value', async () => {
    const onReadStateChange = vi.fn()
    render(<NotificationFilterBar readState="all" onReadStateChange={onReadStateChange} />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Read status' }), 'Unread')
    expect(onReadStateChange).toHaveBeenCalledWith('unread')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <NotificationFilterBar readState="all" onReadStateChange={vi.fn()} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
