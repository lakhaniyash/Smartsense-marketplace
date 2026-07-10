import { useQuery } from '@apollo/client'
import { GetInvoiceByIdDocument } from '@lib/graphql/__generated__/graphql'

// `skip` lets a consumer without an id yet reuse this hook — same pattern
// as useOrder.
export function useInvoice(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetInvoiceByIdDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })

  return {
    invoice: data?.invoice,
    isLoading: id !== undefined && loading,
    error,
    refetch,
  }
}
