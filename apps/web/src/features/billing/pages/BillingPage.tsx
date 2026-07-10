import { useState } from 'react'
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
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { InvoiceFilterBar, InvoiceStatusBadge } from '../components'
import { useInvoices } from '../hooks'
import { exportInvoicesCsv } from '../services'
import { downloadBlob } from '../utils'

const COLUMN_COUNT = 5

function InvoiceTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Invoice #</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="md:text-right">Amount due</TableHead>
        <TableHead>Issued</TableHead>
        <TableHead>Due</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// The Invoice list — M14 (docs/milestones.md). Route-level composition only:
// calls the feature's hook, branches the four view states, arranges
// components (docs/frontend-architecture.md § Feature Module Architecture).
export function BillingPage() {
  const {
    invoices,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useInvoices()
  const { canViewBilling } = usePermissions()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  // Invoices are only ever system-generated (docs/domain-model.md § Billing)
  // — there is no "Create Invoice" action, unlike Orders' "Create Order".
  async function handleExportCsv() {
    setIsExporting(true)
    try {
      const filter = filters.status !== undefined ? { status: filters.status } : {}
      const csv = await exportInvoicesCsv(filter)
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'invoices.csv')
    } catch (exportError) {
      toast({
        title: "Couldn't export invoices",
        ...(exportError instanceof Error && { description: exportError.message }),
        variant: 'danger',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Billing"
        description="Invoices issued on the marketplace."
        action={
          canViewBilling && (
            <Button
              variant="secondary"
              isLoading={isExporting}
              onClick={() => void handleExportCsv()}
            >
              Export CSV
            </Button>
          )
        }
      />
      <InvoiceFilterBar
        status={filters.status}
        onStatusChange={(value) => setFilter('status', value)}
      />

      {isLoading && (
        <Table>
          <InvoiceTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load invoices"
          description="Something went wrong while loading your invoices."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading &&
        error === undefined &&
        invoices.length === 0 &&
        filters.status !== undefined && (
          <EmptyState
            title="No invoices match this filter"
            description="Try a different status, or clear the filter to see all invoices."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilter('status', undefined)}>
                Clear filter
              </Button>
            }
          />
        )}

      {!isLoading &&
        error === undefined &&
        invoices.length === 0 &&
        filters.status === undefined && (
          <EmptyState
            title="No invoices yet"
            description="Invoices generated from completed orders will show up here."
          />
        )}

      {!isLoading && error === undefined && invoices.length > 0 && (
        // The table scrolls in its own bounded region; Pagination is a
        // plain, non-scrolling sibling below it, not layered on top of it
        // (see Pagination.tsx's doc comment for why `position: sticky`
        // was tried and reverted here).
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <InvoiceTableHead />
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell label="Invoice #">
                      <Link
                        to={`${ROUTES.BILLING}/${invoice.id}`}
                        className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell label="Status">
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell label="Amount due" className="md:text-right">
                      ${invoice.amountDue}
                    </TableCell>
                    <TableCell label="Issued">
                      {invoice.issuedAt !== null && invoice.issuedAt !== undefined
                        ? new Date(invoice.issuedAt as string).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell label="Due">
                      {invoice.dueAt !== null && invoice.dueAt !== undefined
                        ? new Date(invoice.dueAt as string).toLocaleDateString()
                        : '—'}
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
