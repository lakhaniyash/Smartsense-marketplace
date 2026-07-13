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
import { CustomerFilterBar, CustomerStatusBadge } from '../components'
import { useCustomers } from '../hooks'

const COLUMN_COUNT = 4

function CustomerTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Billing email</TableHead>
        <TableHead>Created</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// The Customer list — Sprint 2 (SM-322), not a docs/milestones.md milestone.
// Route-level composition only: calls the feature's hook, branches the four
// view states, arranges components (docs/frontend-architecture.md § Feature
// Module Architecture) — same shape as OrdersPage/CatalogPage.
export function CustomersPage() {
  const {
    customers,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useCustomers()
  // SM-323: createCustomer requires customers:manage (Admin-only, distinct
  // from customers:write's Partner-reachable edit/archive/activate) — no
  // role-check needed now that the permission itself expresses this.
  const { canCreateCustomers } = usePermissions()
  const hasActiveFilter = filters.search !== undefined || filters.status !== undefined

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Buyer organizations and individuals on the marketplace."
        action={
          canCreateCustomers && (
            <Link
              to={`${ROUTES.CUSTOMERS}/new`}
              className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Create Customer
            </Link>
          )
        }
      />
      <CustomerFilterBar
        search={filters.search}
        status={filters.status}
        onSearchChange={(value) => setFilter('search', value)}
        onStatusChange={(value) => setFilter('status', value)}
      />

      {isLoading && (
        <Table>
          <CustomerTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load customers"
          description="Something went wrong while loading customers."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && customers.length === 0 && hasActiveFilter && (
        <EmptyState
          title="No customers match this filter"
          description="Try a different search or status, or clear the filters to see everyone."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilter('search', undefined)
                setFilter('status', undefined)
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && customers.length === 0 && !hasActiveFilter && (
        <EmptyState
          title="No customers yet"
          description="Customers who register or place orders will show up here."
          action={
            canCreateCustomers && (
              <Link
                to={`${ROUTES.CUSTOMERS}/new`}
                className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Create Customer
              </Link>
            )
          }
        />
      )}

      {!isLoading && error === undefined && customers.length > 0 && (
        // The table scrolls in its own bounded region; Pagination is a
        // plain, non-scrolling sibling below it — same pattern as
        // OrdersPage/CatalogPage (see Pagination.tsx's doc comment).
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <CustomerTableHead />
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell label="Name">
                      <Link
                        to={`${ROUTES.CUSTOMERS}/${customer.id}`}
                        className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                      >
                        {customer.displayName}
                      </Link>
                    </TableCell>
                    <TableCell label="Status">
                      <CustomerStatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell label="Billing email">{customer.billingEmail}</TableCell>
                    <TableCell label="Created">
                      {new Date(customer.createdAt as string).toLocaleDateString()}
                    </TableCell>
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
