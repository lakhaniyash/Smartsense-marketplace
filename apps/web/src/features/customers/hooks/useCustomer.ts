import { useQuery } from '@apollo/client'
import { GetCustomerByIdDocument } from '@lib/graphql/__generated__/graphql'

// `skip` lets CustomerFormPage-style consumers reuse this hook without an
// id — same pattern as useOrder/useProduct.
export function useCustomer(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetCustomerByIdDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })

  return {
    customer: data?.customerById,
    isLoading: id !== undefined && loading,
    error,
    refetch,
  }
}
