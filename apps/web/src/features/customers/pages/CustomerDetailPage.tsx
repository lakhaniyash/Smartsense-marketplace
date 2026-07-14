import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  ActivateCustomerDocument,
  ArchiveCustomerDocument,
  CustomerStatus,
  GetCustomerAuditLogDocument,
  GetCustomerByIdDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  Tabs,
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { useBreadcrumb } from '@shared/layouts'
import {
  CustomerActivityTab,
  CustomerAddressList,
  CustomerAssignedUsersList,
  CustomerDetailsCard,
  CustomerOrdersTab,
} from '../components'
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
    error: ordersError,
    refetch: refetchOrders,
    goToNextPage: goToNextOrdersPage,
    goToPreviousPage: goToPreviousOrdersPage,
    hasPreviousPage: hasPreviousOrdersPage,
  } = useCustomerOrders(id)
  const {
    entries: auditEntries,
    isLoading: isAuditLoading,
    error: auditError,
    refetch: refetchAuditLog,
  } = useCustomerAuditLog(id)
  const { canEditCustomers } = usePermissions()
  const { toast } = useToast()
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false)
  useBreadcrumb(customer?.displayName)

  const [archiveCustomer, { loading: isArchiving }] = useMutation(ArchiveCustomerDocument, {
    // GetCustomerAuditLogDocument too — the Activity tab's own query would
    // otherwise keep showing whatever it last fetched (stale Apollo cache),
    // never picking up the CUSTOMER_ARCHIVED entry this action just wrote.
    refetchQueries: [GetCustomerByIdDocument, GetCustomerAuditLogDocument],
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
    refetchQueries: [GetCustomerByIdDocument, GetCustomerAuditLogDocument],
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
                content: <CustomerDetailsCard customer={customer} />,
              },
              {
                value: 'orders',
                label: 'Orders',
                content: (
                  <CustomerOrdersTab
                    orders={orders}
                    pageInfo={ordersPageInfo}
                    isLoading={isOrdersLoading}
                    error={ordersError}
                    onRetry={() => void refetchOrders()}
                    hasPreviousPage={hasPreviousOrdersPage}
                    onNext={goToNextOrdersPage}
                    onPrevious={goToPreviousOrdersPage}
                  />
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
                content: <CustomerAssignedUsersList assignedUsers={customer.assignedUsers} />,
              },
              {
                value: 'timeline',
                label: 'Activity',
                content: (
                  <CustomerActivityTab
                    entries={auditEntries}
                    isLoading={isAuditLoading}
                    error={auditError}
                    onRetry={() => void refetchAuditLog()}
                  />
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
