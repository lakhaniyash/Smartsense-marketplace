import { apolloClient } from '@lib/apollo'
import {
  ExportCustomersCsvDocument,
  type CustomerFilterInput,
} from '@lib/graphql/__generated__/graphql'

// Imperative, non-hook operation triggered by a button click rather than a
// component's render — the Services tier per docs/frontend-architecture.md
// § Feature Module Architecture ("imperative, non-hook operations"), same
// pattern as Billing's exportInvoicesCsv. `apolloClient`'s default `query`
// fetch policy is already `network-only` (docs/graphql.md § 9), so a
// re-export always reflects the caller's current, visible customers.
export async function exportCustomersCsv(filter: CustomerFilterInput): Promise<string> {
  const { data } = await apolloClient.query({
    query: ExportCustomersCsvDocument,
    variables: { filter },
  })
  return data.exportCustomersCsv
}
