import { useQuery } from '@apollo/client'
import { GetProductByIdDocument } from '@lib/graphql/__generated__/graphql'

// `skip` lets ProductFormPage reuse this hook in create mode (no id yet)
// without firing a doomed query for an empty id.
export function useProduct(id: string | undefined) {
  const { data, loading, error } = useQuery(GetProductByIdDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })

  return {
    product: data?.productById,
    isLoading: id !== undefined && loading,
    error,
  }
}
