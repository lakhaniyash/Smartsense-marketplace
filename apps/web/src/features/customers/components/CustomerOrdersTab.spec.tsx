import type { ApolloError } from '@apollo/client'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { OrderStatus } from '@lib/graphql/__generated__/graphql'
import { CustomerOrdersTab } from './CustomerOrdersTab'

const ORDER = {
  id: 'order-1',
  orderNumber: 'ORD-1001',
  status: OrderStatus.Confirmed,
  total: '100.00',
  placedAt: '2026-07-01T00:00:00.000Z',
}

function renderTab(props: Partial<React.ComponentProps<typeof CustomerOrdersTab>> = {}) {
  return render(
    <MemoryRouter>
      <CustomerOrdersTab
        orders={[]}
        pageInfo={undefined}
        isLoading={false}
        error={undefined}
        onRetry={vi.fn()}
        hasPreviousPage={false}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('CustomerOrdersTab', () => {
  it('renders a real error state instead of the empty state when the query fails', () => {
    renderTab({ error: {} as ApolloError, orders: [] })

    expect(screen.getByText("Couldn't load orders")).toBeInTheDocument()
    expect(screen.queryByText('No orders yet')).not.toBeInTheDocument()
  })

  it("calls onRetry when the error state's retry button is clicked", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderTab({ error: {} as ApolloError, onRetry })

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state only when there is no error and no orders', () => {
    renderTab()

    expect(screen.getByText('No orders yet')).toBeInTheDocument()
  })

  it('renders the orders table when data is present', () => {
    renderTab({ orders: [ORDER] })

    expect(screen.getByText('ORD-1001')).toBeInTheDocument()
    expect(screen.queryByText('No orders yet')).not.toBeInTheDocument()
  })

  it('has no accessibility violations in the error state', async () => {
    const { container } = renderTab({ error: {} as ApolloError })

    expect(await axe(container)).toHaveNoViolations()
  })
})
