import { useQuery } from '@apollo/client'
import { GetUserAuditLogDocument } from '@lib/graphql/__generated__/graphql'

// Backs the User detail page's Activity Timeline tab — same shape as
// useCustomerAuditLog.
export function useUserAuditLog(userId: string | undefined) {
  const { data, loading, error, refetch } = useQuery(GetUserAuditLogDocument, {
    variables: { userId: userId ?? '' },
    skip: userId === undefined,
  })
  return {
    entries: data?.userAuditLog ?? [],
    isLoading: userId !== undefined && loading,
    error,
    refetch,
  }
}
