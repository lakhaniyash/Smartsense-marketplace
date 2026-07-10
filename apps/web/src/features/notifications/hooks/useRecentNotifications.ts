import { useQuery } from '@apollo/client'
import { GetNotificationsDocument } from '@lib/graphql/__generated__/graphql'
import { DROPDOWN_PAGE_SIZE } from '../constants'

// The header dropdown's small fixed list — `shouldFetch` stays false until
// the dropdown is opened for the first time (Popover's onOpenChange), so
// this never fires unconditionally on every authenticated page load. Sorted
// most-recent-first only (the backend's one hardcoded order, not
// unread-first) — an older unread item can scroll out of this top-N window
// while still counted in the badge; accepted limitation for this milestone.
export function useRecentNotifications(shouldFetch: boolean) {
  const { data, loading, error } = useQuery(GetNotificationsDocument, {
    variables: { first: DROPDOWN_PAGE_SIZE, after: null, filter: null },
    skip: !shouldFetch,
  })

  return {
    notifications: data?.notifications.edges.map((edge) => edge.node) ?? [],
    isLoading: loading,
    error,
  }
}
