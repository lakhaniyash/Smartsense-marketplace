import { useQuery } from '@apollo/client'
import { GetRolesDocument } from '@lib/graphql/__generated__/graphql'

// Every assignable Role with its granted Permissions — backs both the role
// picker on the User detail page and the Roles admin page.
export function useRoles() {
  const { data, loading, error, refetch } = useQuery(GetRolesDocument)
  return { roles: data?.roles ?? [], isLoading: loading, error, refetch }
}
