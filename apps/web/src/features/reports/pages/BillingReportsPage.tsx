import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link } from 'react-router'
import { useAuth, usePermissions } from '@features/auth'
import {
  BillingReportStatus,
  GenerateBillingReportDocument,
  GetBillingReportsDocument,
} from '@lib/graphql/__generated__/graphql'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  useToast,
  type SelectOption,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import {
  BillingReportStatusBadge,
  GenerateBillingReportForm,
  type GenerateBillingReportFormValues,
} from '../components'
import { useBillingReports } from '../hooks'

const COLUMN_COUNT = 6

const STATUS_OPTIONS: SelectOption[] = [
  { value: BillingReportStatus.Generated, label: 'Generated' },
  { value: BillingReportStatus.Finalized, label: 'Finalized' },
  { value: BillingReportStatus.PaidOut, label: 'Paid out' },
]

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

function BillingReportTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Period</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="md:text-right">Gross revenue</TableHead>
        <TableHead className="md:text-right">Commission</TableHead>
        <TableHead className="md:text-right">Net payout</TableHead>
        <TableHead>Generated</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// A near-clone of BillingPage (M15 plan § Frontend Architecture) — same
// Table+Pagination shape, with "Generate report" replacing Billing's absent
// create action (docs/domain-model.md § Billing: Invoices are only ever
// system-generated; BillingReport, unlike Invoice, is a caller-triggered
// action).
export function BillingReportsPage() {
  const {
    billingReports,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useBillingReports()
  const { canViewReports } = usePermissions()
  const { identity } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const isAdmin = identity?.roles.includes('Admin') ?? false

  const [generateBillingReport, { loading: isSubmitting }] = useMutation(
    GenerateBillingReportDocument,
    {
      refetchQueries: [GetBillingReportsDocument],
      onCompleted: () => {
        setIsGenerating(false)
        toast({ title: 'Billing report generated', variant: 'success' })
      },
      onError: (mutationError) => {
        toast({
          title: "Couldn't generate billing report",
          description: mutationError.message,
          variant: 'danger',
        })
      },
    },
  )

  function handleGenerate(values: GenerateBillingReportFormValues) {
    // Unlike `toDateRangeInput` (features/reports/constants/index.ts),
    // periodStart/periodEnd deliberately stay literal UTC dates (a trailing
    // `Z`, no local-timezone parsing): BillingReport.periodStart/periodEnd
    // are `@db.Date` columns (schema.prisma's own comment — "periods are
    // day-granular"), not timestamps, so Postgres truncates the instant to
    // its UTC calendar date. Converting the picked day from local time first
    // would shift it a day for any timezone ahead of UTC once truncated
    // (verified directly against the running API — see M15 verification).
    void generateBillingReport({
      variables: {
        input: {
          periodStart: `${values.periodStart}T00:00:00.000Z`,
          periodEnd: `${values.periodEnd}T00:00:00.000Z`,
          ...(values.partnerId !== undefined &&
            values.partnerId !== '' && { partnerId: values.partnerId }),
        },
      },
    })
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Billing Reports"
        description="Per-partner statements reconciling gross revenue, commission, and net payout."
        action={
          canViewReports && <Button onClick={() => setIsGenerating(true)}>Generate report</Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          aria-label="Status"
          placeholder="All statuses"
          clearable
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value || undefined)}
        />
      </div>

      {isLoading && (
        <Table>
          <BillingReportTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load billing reports"
          description="Something went wrong while loading billing reports."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading &&
        error === undefined &&
        billingReports.length === 0 &&
        filters.status !== undefined && (
          <EmptyState
            title="No billing reports match this filter"
            description="Try a different status, or clear the filter to see all billing reports."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilter('status', undefined)}>
                Clear filter
              </Button>
            }
          />
        )}

      {!isLoading &&
        error === undefined &&
        billingReports.length === 0 &&
        filters.status === undefined && (
          <EmptyState
            title="No billing reports yet"
            description="Generate the first billing report for a Partner and period."
          />
        )}

      {!isLoading && error === undefined && billingReports.length > 0 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <BillingReportTableHead />
              <TableBody>
                {billingReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell label="Period">
                      <Link
                        to={`${ROUTES.REPORTS_BILLING_REPORTS}/${report.id}`}
                        className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
                      >
                        {formatDate(report.periodStart as string)} –{' '}
                        {formatDate(report.periodEnd as string)}
                      </Link>
                    </TableCell>
                    <TableCell label="Status">
                      <BillingReportStatusBadge status={report.status} />
                    </TableCell>
                    <TableCell label="Gross revenue" className="md:text-right">
                      ${report.grossRevenue}
                    </TableCell>
                    <TableCell label="Commission" className="md:text-right">
                      ${report.commissionAmount}
                    </TableCell>
                    <TableCell label="Net payout" className="md:text-right">
                      ${report.netPayout}
                    </TableCell>
                    <TableCell label="Generated">
                      {formatDate(report.generatedAt as string)}
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

      {canViewReports && (
        <GenerateBillingReportForm
          open={isGenerating}
          onOpenChange={setIsGenerating}
          onSubmit={handleGenerate}
          isSubmitting={isSubmitting}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
