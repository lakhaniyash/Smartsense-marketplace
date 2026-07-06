import { useQuery } from '@apollo/client'
import { GetCategoriesDocument } from '@lib/graphql/__generated__/graphql'

// No `skip` guard needed (contrast useCurrentUser): this hook only ever
// mounts inside the catalog:read PermissionRoute, so the caller is always
// authenticated with the required permission by the time it renders.
export function useCategories() {
  const { data, loading, error } = useQuery(GetCategoriesDocument)

  return {
    categories: data?.categories ?? [],
    isLoading: loading,
    error,
  }
}
