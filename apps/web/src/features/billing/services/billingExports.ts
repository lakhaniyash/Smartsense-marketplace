import { apolloClient } from '@lib/apollo'
import {
  ExportInvoicesCsvDocument,
  InvoicePdfDocument,
  type InvoiceFilterInput,
} from '@lib/graphql/__generated__/graphql'

// Imperative, non-hook operations triggered by a button click rather than a
// component's render — the Services tier per docs/frontend-architecture.md
// § Feature Module Architecture ("imperative, non-hook operations"), not a
// hook, since nothing here is watched or rendered. `apolloClient`'s default
// `query` fetch policy is already `network-only` (docs/graphql.md § 9), so a
// re-export always reflects the caller's current, visible invoices.
export async function exportInvoicesCsv(filter: InvoiceFilterInput): Promise<string> {
  const { data } = await apolloClient.query({
    query: ExportInvoicesCsvDocument,
    variables: { filter },
  })
  return data.exportInvoicesCsv
}

export async function fetchInvoicePdf(id: string): Promise<string> {
  const { data } = await apolloClient.query({
    query: InvoicePdfDocument,
    variables: { id },
  })
  return data.invoicePdf
}
