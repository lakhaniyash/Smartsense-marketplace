import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { NotificationRow, type NotificationRowNode } from './NotificationRow'

function notification(overrides: Partial<NotificationRowNode> = {}): NotificationRowNode {
  return {
    id: 'notification-1',
    title: 'Order confirmed',
    body: 'Your order ORD-1 was confirmed.',
    entityType: 'Order',
    entityId: 'order-1',
    status: 'UNREAD' as NotificationRowNode['status'],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('NotificationRow', () => {
  it('renders the title and body', () => {
    render(
      <MemoryRouter>
        <NotificationRow notification={notification()} onMarkAsRead={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Order confirmed')).toBeInTheDocument()
    expect(screen.getByText('Your order ORD-1 was confirmed.')).toBeInTheDocument()
  })

  it('links to the referenced Order via entityType/entityId', () => {
    render(
      <MemoryRouter>
        <NotificationRow notification={notification()} onMarkAsRead={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/orders/order-1')
  })

  it('links to the referenced Invoice when entityType is Invoice', () => {
    render(
      <MemoryRouter>
        <NotificationRow
          notification={notification({ entityType: 'Invoice', entityId: 'invoice-1' })}
          onMarkAsRead={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/billing/invoice-1')
  })

  it('renders a plain button (no link) when there is no linkable entity', () => {
    render(
      <MemoryRouter>
        <NotificationRow
          notification={notification({ entityType: null, entityId: null })}
          onMarkAsRead={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onMarkAsRead when an UNREAD row is clicked', async () => {
    const onMarkAsRead = vi.fn()
    render(
      <MemoryRouter>
        <NotificationRow notification={notification()} onMarkAsRead={onMarkAsRead} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('link'))
    expect(onMarkAsRead).toHaveBeenCalledWith('notification-1')
  })

  it('does not call onMarkAsRead when an already-READ row is clicked', async () => {
    const onMarkAsRead = vi.fn()
    render(
      <MemoryRouter>
        <NotificationRow
          notification={notification({ status: 'READ' as NotificationRowNode['status'] })}
          onMarkAsRead={onMarkAsRead}
        />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('link'))
    expect(onMarkAsRead).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ul>
          <NotificationRow notification={notification()} onMarkAsRead={vi.fn()} />
        </ul>
      </MemoryRouter>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
