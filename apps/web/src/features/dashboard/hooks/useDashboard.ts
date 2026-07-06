import { useQuery } from '@apollo/client'
import { DashboardStatsDocument } from '@lib/graphql/__generated__/graphql'

// No `skip` guard needed (contrast useCurrentUser): this hook only ever
// mounts inside the dashboard:view PermissionRoute, so the caller is always
// authenticated with the required permission by the time it renders.
export function useDashboard() {
  const { data, loading, error, refetch } = useQuery(DashboardStatsDocument)

  return {
    stats: data?.dashboardStats,
    isLoading: loading,
    error,
    refetch,
  }
}
