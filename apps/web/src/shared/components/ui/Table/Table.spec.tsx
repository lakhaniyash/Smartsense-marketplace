import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table'
import { TableSkeleton } from './TableSkeleton'

function SampleTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell label="Order">#1234</TableCell>
          <TableCell label="Status">Shipped</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

describe('Table', () => {
  it('renders semantic table roles with real markup', () => {
    render(<SampleTable />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Order' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /#1234/ })).toBeInTheDocument()
  })

  it('renders a mobile label alongside each cell value', () => {
    render(<SampleTable />)

    expect(screen.getByText('Order', { selector: 'span' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SampleTable />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('TableSkeleton', () => {
  it('renders one skeleton per cell matching rows x columns', () => {
    const { container } = render(
      <Table>
        <TableSkeleton rows={3} columns={2} />
      </Table>,
    )

    expect(container.querySelectorAll('tr')).toHaveLength(3)
    expect(container.querySelectorAll('td')).toHaveLength(6)
  })
})
