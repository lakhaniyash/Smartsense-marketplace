import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CustomerStatus, CustomerType } from '@lib/graphql/__generated__/graphql'
import { CustomerDetailsCard } from './CustomerDetailsCard'

describe('CustomerDetailsCard', () => {
  it('renders the billing summary when present', () => {
    render(
      <CustomerDetailsCard
        customer={{
          status: CustomerStatus.Active,
          type: CustomerType.Organization,
          billingSummary: { totalOrders: 3, totalInvoiced: '150.00', totalOutstanding: '50.00' },
        }}
      />,
    )

    expect(screen.getByText('Total orders')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('omits the billing summary block when null (the customers list case)', () => {
    render(
      <CustomerDetailsCard
        customer={{
          status: CustomerStatus.Active,
          type: CustomerType.Individual,
          billingSummary: null,
        }}
      />,
    )

    expect(screen.queryByText('Total orders')).not.toBeInTheDocument()
  })
})
