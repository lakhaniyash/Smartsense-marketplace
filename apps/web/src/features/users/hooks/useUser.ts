import { useQuery } from '@apollo/client'
import { GetUserByIdDocument } from '@lib/graphql/__generated__/graphql'

// Same skip/`id ?? ''` idiom as useCustomer — the query never fires with an
// empty id, and isLoading stays false until a real id is present.
export function useUser(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetUserByIdDocument, {
    variables: { id: id ?? '' },
    skip: id === undefined,
  })
  return { user: data?.userById, isLoading: id !== undefined && loading, error, refetch }
}
