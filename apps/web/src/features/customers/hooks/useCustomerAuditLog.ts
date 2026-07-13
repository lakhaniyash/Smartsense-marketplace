import { useQuery } from '@apollo/client'
import { GetCustomerAuditLogDocument } from '@lib/graphql/__generated__/graphql'

// Backs the Customer detail page's Activity Timeline tab — kept as its own
// query (rather than nested on GetCustomerById) since a viewer may never
// open that tab, same reasoning as useOrderableVariants being separate from
// useOrder.
export function useCustomerAuditLog(customerId: string | undefined) {
  const { data, loading, error } = useQuery(GetCustomerAuditLogDocument, {
    variables: { customerId: customerId ?? '' },
    skip: customerId === undefined,
  })

  return {
    entries: data?.customerAuditLog ?? [],
    isLoading: customerId !== undefined && loading,
    error,
  }
}
