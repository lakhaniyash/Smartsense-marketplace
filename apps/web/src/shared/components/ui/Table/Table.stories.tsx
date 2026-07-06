import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table'
import { TableSkeleton } from './TableSkeleton'

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
}

export default meta
type Story = StoryObj<typeof Table>

const orders = [
  { id: '#1234', status: 'Shipped' as const },
  { id: '#1235', status: 'Pending' as const },
]

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell label="Order">{order.id}</TableCell>
            <TableCell label="Status">
              <Badge variant={order.status === 'Shipped' ? 'success' : 'warning'}>
                {order.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const Loading: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableSkeleton columns={2} />
    </Table>
  ),
}
