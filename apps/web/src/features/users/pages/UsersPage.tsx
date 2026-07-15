import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { UserFilterBar, UserStatusBadge } from '../components'
import { useUsers } from '../hooks'
import { formatUserOwnerType } from '../utils'

const COLUMN_COUNT = 4

function UserTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Owner</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// The User list — Sprint 3 (User Management, SM-339), not a docs/milestones.md
// milestone. Route-level composition only: calls the feature's hook, branches
// the four view states, arranges components (docs/frontend-architecture.md
// § Feature Module Architecture) — same shape as CustomersPage/OrdersPage.
// Row names link to the detail page; the header exposes Invite / Manage-roles
// actions gated on users:manage (SM-340).
export function UsersPage() {
  const {
    users,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useUsers()
  const { canManageUsers } = usePermissions()
  const hasActiveFilter =
    filters.search !== undefined || filters.status !== undefined || filters.ownerType !== undefined

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Users"
        description="People with access to the marketplace — platform staff, partner, and customer accounts."
        action={
          canManageUsers && (
            <div className="flex gap-2">
              <Link
                to={ROUTES.USERS_ROLES}
                className="border-border-default text-fg-default hover:bg-neutral-subtle focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Manage roles
              </Link>
              <Link
                to={ROUTES.USERS_INVITE}
                className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Invite user
              </Link>
            </div>
          )
        }
      />
      <UserFilterBar
        search={filters.search}
        status={filters.status}
        ownerType={filters.ownerType}
        onSearchChange={(value) => setFilter('search', value)}
        onStatusChange={(value) => setFilter('status', value)}
        onOwnerTypeChange={(value) => setFilter('ownerType', value)}
      />

      {isLoading && (
        <Table>
          <UserTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load users"
          description="Something went wrong while loading users."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && users.length === 0 && hasActiveFilter && (
        <EmptyState
          title="No users match this filter"
          description="Try a different search, status, or owner type, or clear the filters to see everyone."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilter('search', undefined)
                setFilter('status', undefined)
                setFilter('ownerType', undefined)
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && users.length === 0 && !hasActiveFilter && (
        <EmptyState
          title="No users yet"
          description="Invited and provisioned users will show up here."
        />
      )}

      {!isLoading && error === undefined && users.length > 0 && (
        // The table scrolls in its own bounded region; Pagination is a plain,
        // non-scrolling sibling below it — same pattern as CustomersPage.
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <UserTableHead />
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell label="Name">
                      <Link
                        to={`${ROUTES.USERS}/${user.id}`}
                        className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                      >
                        {user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell label="Email">{user.email}</TableCell>
                    <TableCell label="Status">
                      <UserStatusBadge status={user.status} />
                    </TableCell>
                    <TableCell label="Owner">{formatUserOwnerType(user.ownerType)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-border-default border-t pt-3">
            <Pagination
              hasPreviousPage={hasPreviousPage}
              hasNextPage={pageInfo?.hasNextPage ?? false}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
