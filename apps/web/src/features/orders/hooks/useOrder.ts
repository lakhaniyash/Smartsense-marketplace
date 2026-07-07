import { useQuery } from '@apollo/client'
import { GetOrderByIdDocument } from '@lib/graphql/__generated__/graphql'

// `skip` lets OrderFormPage-style consumers reuse this hook without an id —
// same pattern as useProduct.
export function useOrder(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetOrderByIdDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })

  return {
    order: data?.order,
    isLoading: id !== undefined && loading,
    error,
    refetch,
  }
}
