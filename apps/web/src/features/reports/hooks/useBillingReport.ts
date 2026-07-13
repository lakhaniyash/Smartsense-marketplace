import { useQuery } from '@apollo/client'
import { GetBillingReportDocument } from '@lib/graphql/__generated__/graphql'

// `skip` lets a consumer without an id yet reuse this hook — same pattern as
// useInvoice/useOrder.
export function useBillingReport(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetBillingReportDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })

  return {
    billingReport: data?.billingReport,
    isLoading: id !== undefined && loading,
    error,
    refetch,
  }
}
