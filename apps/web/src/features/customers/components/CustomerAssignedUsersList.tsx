import type { Customer } from '@lib/graphql/__generated__/graphql'
import {
  Card,
  CardContent,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components'

export interface CustomerAssignedUsersListProps {
  assignedUsers: Customer['assignedUsers']
}

// The Assigned Users tab — a read-only view of buyer-contact Users already
// linked to this Customer (User.customerId), not a separate account-manager
// assignment. No loading/error state of its own: sourced from the same
// customerById fetch the rest of the page already resolved.
export function CustomerAssignedUsersList({ assignedUsers }: CustomerAssignedUsersListProps) {
  if (assignedUsers.length === 0) {
    return (
      <EmptyState
        title="No assigned users"
        description="Buyer-contact users linked to this account will show up here."
      />
    )
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedUsers.map((assignedUser) => (
              <TableRow key={assignedUser.id}>
                <TableCell label="Name">{assignedUser.fullName}</TableCell>
                <TableCell label="Email">{assignedUser.email}</TableCell>
                <TableCell label="Status">{assignedUser.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
