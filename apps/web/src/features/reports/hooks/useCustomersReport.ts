import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import { GetCustomersReportDocument } from '@lib/graphql/__generated__/graphql'

// Point-in-time snapshot — no date range, same reasoning as
// useInventoryReport (CustomersReport's own doc comment, apps/api's
// customers-report.output.ts). No partnerId selector in the UI either
// (ReportFilterBar's own comment: no partner-listing query exists yet) —
// `partnerId` is only ever populated for API-shape parity with every other
// report filter, same as useOrdersReport/useInventoryReport.
export function useCustomersReport() {
  const [searchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') ?? undefined

  const { data, loading, error, refetch } = useQuery(GetCustomersReportDocument, {
    variables: {
      filter: { ...(partnerId !== undefined && { partnerId }) },
    },
  })

  return {
    report: data?.customersReport,
    isLoading: loading,
    error,
    refetch,
  }
}
