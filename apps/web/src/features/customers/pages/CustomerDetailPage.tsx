import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  ActivateCustomerDocument,
  ArchiveCustomerDocument,
  CustomerStatus,
  GetCustomerByIdDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { useBreadcrumb } from '@shared/layouts'
import { CustomerAddressList, CustomerStatusBadge, CustomerTimeline } from '../components'
import { useCustomer, useCustomerAuditLog, useCustomerOrders } from '../hooks'

// The shell renders its breadcrumb automatically from route metadata
// (shared/layouts/Breadcrumbs.tsx) — same pattern as OrderDetailPage;
// useBreadcrumb below only supplies the real display name once it loads.
export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { customer, isLoading, error } = useCustomer(id)
  const {
    orders,
    pageInfo: ordersPageInfo,
    isLoading: isOrdersLoading,
    goToNextPage: goToNextOrdersPage,
    goToPreviousPage: goToPreviousOrdersPage,
    hasPreviousPage: hasPreviousOrdersPage,
  } = useCustomerOrders(id)
  const { entries: auditEntries, isLoading: isAuditLoading } = useCustomerAuditLog(id)
  const { canEditCustomers } = usePermissions()
  const { toast } = useToast()
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false)
  useBreadcrumb(customer?.displayName)

  const [archiveCustomer, { loading: isArchiving }] = useMutation(ArchiveCustomerDocument, {
    refetchQueries: [GetCustomerByIdDocument],
    onCompleted: () => {
      setIsConfirmingArchive(false)
      toast({ title: 'Customer suspended', variant: 'success' })
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't suspend customer",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  const [activateCustomer, { loading: isActivating }] = useMutation(ActivateCustomerDocument, {
    refetchQueries: [GetCustomerByIdDocument],
    onCompleted: () => toast({ title: 'Customer reactivated', variant: 'success' }),
    onError: (mutationError) => {
      toast({
        title: "Couldn't reactivate customer",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  return (
    <div className="flex flex-col gap-6">
      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (error !== undefined || customer === undefined) && (
        <ErrorState
          title="Couldn't load this customer"
          description="It may not exist, or you may not have access to it."
          action={
            <Link
              to={ROUTES.CUSTOMERS}
              className="border-border-control bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Back to customers
            </Link>
          }
        />
      )}

      {!isLoading && error === undefined && customer !== undefined && (
        <>
          <PageHeader
            title={customer.displayName}
            description={customer.billingEmail}
            action={
              canEditCustomers && (
                <div className="flex gap-2">
                  <Link
                    to={`${ROUTES.CUSTOMERS}/${customer.id}/edit`}
                    className="border-border-control bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Edit
                  </Link>
                  {customer.status === CustomerStatus.Active ? (
                    <Button variant="danger" onClick={() => setIsConfirmingArchive(true)}>
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      isLoading={isActivating}
                      onClick={() => void activateCustomer({ variables: { id: customer.id } })}
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              )
            }
          />
          <Tabs
            items={[
              {
                value: 'details',
                label: 'Details',
                content: (
                  <Card>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <CustomerStatusBadge status={customer.status} />
                        <span className="text-fg-muted text-sm">
                          {customer.type === 'INDIVIDUAL' ? 'Individual' : 'Organization'}
                        </span>
                      </div>
                      {customer.billingSummary !== null &&
                        customer.billingSummary !== undefined && (
                          <div className="border-border-default flex flex-wrap gap-6 border-t pt-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-fg-muted text-xs font-medium">
                                Total orders
                              </span>
                              <span className="text-fg-default text-lg font-semibold">
                                {customer.billingSummary.totalOrders}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-fg-muted text-xs font-medium">
                                Total invoiced
                              </span>
                              <span className="text-fg-default text-lg font-semibold">
                                ${customer.billingSummary.totalInvoiced}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-fg-muted text-xs font-medium">Outstanding</span>
                              <span className="text-fg-default text-lg font-semibold">
                                ${customer.billingSummary.totalOutstanding}
                              </span>
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'orders',
                label: 'Orders',
                content: isOrdersLoading ? (
                  <Skeleton className="h-40 w-full rounded-lg" />
                ) : orders.length === 0 ? (
                  <EmptyState
                    title="No orders yet"
                    description="Orders placed by this customer will show up here."
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col gap-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="md:text-right">Total</TableHead>
                            <TableHead>Placed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell label="Order #">
                                <Link
                                  to={`${ROUTES.ORDERS}/${order.id}`}
                                  className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                                >
                                  {order.orderNumber}
                                </Link>
                              </TableCell>
                              <TableCell label="Status">{order.status}</TableCell>
                              <TableCell label="Total" className="md:text-right">
                                ${order.total}
                              </TableCell>
                              <TableCell label="Placed">
                                {order.placedAt !== null && order.placedAt !== undefined
                                  ? new Date(order.placedAt as string).toLocaleDateString()
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Pagination
                        hasPreviousPage={hasPreviousOrdersPage}
                        hasNextPage={ordersPageInfo?.hasNextPage ?? false}
                        onPrevious={goToPreviousOrdersPage}
                        onNext={goToNextOrdersPage}
                      />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'addresses',
                label: 'Addresses',
                content: (
                  <CustomerAddressList
                    customerId={customer.id}
                    addresses={customer.addresses}
                    canEdit={canEditCustomers}
                  />
                ),
              },
              {
                value: 'users',
                label: 'Assigned Users',
                content:
                  customer.assignedUsers.length === 0 ? (
                    <EmptyState
                      title="No assigned users"
                      description="Buyer-contact users linked to this account will show up here."
                    />
                  ) : (
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
                            {customer.assignedUsers.map((assignedUser) => (
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
                  ),
              },
              {
                value: 'timeline',
                label: 'Activity',
                content: isAuditLoading ? (
                  <Skeleton className="h-40 w-full rounded-lg" />
                ) : (
                  <CustomerTimeline entries={auditEntries} />
                ),
              },
            ]}
          />

          <Dialog
            open={isConfirmingArchive}
            onOpenChange={setIsConfirmingArchive}
            title="Suspend this customer?"
            description={`${customer.displayName} will no longer be able to place new orders, but can still view order history. This can be reversed.`}
            confirmLabel="Suspend"
            variant="danger"
            isConfirming={isArchiving}
            onConfirm={() => void archiveCustomer({ variables: { id: customer.id } })}
          />
        </>
      )}
    </div>
  )
}
