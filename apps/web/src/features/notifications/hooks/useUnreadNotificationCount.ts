import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { GetUnreadNotificationCountDocument } from '@lib/graphql/__generated__/graphql'
import { UNREAD_COUNT_POLL_INTERVAL_MS } from '../constants'

function useIsDocumentVisible(): boolean {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return isVisible
}

// Polls rather than subscribes — no WebSockets/GraphQL subscriptions in this
// milestone (docs/roadmap.md § Notifications). Paused (pollInterval: 0, per
// Apollo's own documented "stop polling" value) while the tab is backgrounded,
// so the always-mounted header badge doesn't poll indefinitely for a
// backgrounded session.
export function useUnreadNotificationCount() {
  const isVisible = useIsDocumentVisible()
  const { data, loading } = useQuery(GetUnreadNotificationCountDocument, {
    pollInterval: isVisible ? UNREAD_COUNT_POLL_INTERVAL_MS : 0,
  })

  return {
    unreadCount: data?.unreadNotificationCount ?? 0,
    isLoading: loading,
  }
}
