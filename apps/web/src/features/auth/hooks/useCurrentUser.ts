import { useQuery } from '@apollo/client'
import { MeDocument } from '@lib/graphql/__generated__/graphql'
import { useAuth } from './useAuth'

export function useCurrentUser() {
  const { isAuthenticated } = useAuth()
  const { data, loading, error } = useQuery(MeDocument, { skip: !isAuthenticated })

  return {
    user: data?.me,
    isLoading: isAuthenticated && loading,
    error,
  }
}
