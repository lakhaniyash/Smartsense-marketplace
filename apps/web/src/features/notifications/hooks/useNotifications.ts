import { useQuery } from '@apollo/client'
import { useSearchParams } from 'react-router'
import {
  type NotificationFilterInput,
  NotificationStatus,
  GetNotificationsDocument,
} from '@lib/graphql/__generated__/graphql'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'
import type { NotificationReadFilter } from '../types'

function readReadFilterParam(searchParams: URLSearchParams): NotificationReadFilter {
  const raw = searchParams.get('readState')
  if (raw === 'unread' || raw === 'read') return raw
  return 'all'
}

// URL-backed filter/cursor state, same pattern as useInvoices — forward-only
// pagination (first/after) with a client-side cursorStack for "Previous",
// since the backend only implements forward pagination (docs/graphql.md).
export function useNotifications() {
  const [searchParams, setSearchParams] = useSearchParams()

  const readState = readReadFilterParam(searchParams)
  const after = searchParams.get('after') ?? undefined
  const cursorStackParam = searchParams.get('cursorStack')
  const cursorStack = cursorStackParam === null ? [] : cursorStackParam.split(',')

  const filter: NotificationFilterInput = {}
  if (readState === 'unread') filter.status = NotificationStatus.Unread
  if (readState === 'read') filter.status = NotificationStatus.Read

  const { data, loading, error, refetch } = useQuery(GetNotificationsDocument, {
    variables: {
      first: DEFAULT_PAGE_SIZE,
      after: after ?? null,
      filter,
    },
  })

  function setReadState(value: NotificationReadFilter) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('after')
      next.delete('cursorStack')
      if (value === 'all') next.delete('readState')
      else next.set('readState', value)
      return next
    })
  }

  function goToNextPage() {
    const endCursor = data?.notifications.pageInfo.endCursor
    if (endCursor === undefined || endCursor === null) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('cursorStack', [...cursorStack, after ?? ''].join(','))
      next.set('after', endCursor)
      return next
    })
  }

  function goToPreviousPage() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (cursorStack.length === 0) {
        next.delete('after')
        next.delete('cursorStack')
        return next
      }
      const previousAfter = cursorStack[cursorStack.length - 1]
      const remainingStack = cursorStack.slice(0, -1)
      if (remainingStack.length === 0) next.delete('cursorStack')
      else next.set('cursorStack', remainingStack.join(','))
      if (previousAfter === undefined || previousAfter === '') next.delete('after')
      else next.set('after', previousAfter)
      return next
    })
  }

  return {
    notifications: data?.notifications.edges.map((edge) => edge.node) ?? [],
    pageInfo: data?.notifications.pageInfo,
    readState,
    isLoading: loading,
    error,
    setReadState,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage: after !== undefined,
    refetch,
  }
}
