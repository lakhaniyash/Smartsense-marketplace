import type { Prisma } from '@prisma/client'
// `import PDFDocument from 'pdfkit'` type-checks (allowSyntheticDefaultImports)
// but breaks at runtime: this project's tsconfig doesn't set esModuleInterop,
// so a default import compiles to a bare `.default` property access, and
// pdfkit's CJS export (`export = PDFDocument`, per @types/pdfkit) has no such
// property — the call site then throws "pdfkit_1.default is not a
// constructor". A namespace import binds directly to the whole `export =`
// value instead (no interop flag needed) and is ESLint's required form over
// `import X = require(...)` (`@typescript-eslint/no-require-imports`).
import * as PDFDocument from 'pdfkit'

// Self-contained include shape (not imported from billing.service.ts) so
// this stays a leaf utility with no dependency back on the service that
// calls it — BillingService.getInvoicePdf's query is structurally
// compatible with this type without either file importing the other.
export type InvoiceForPdf = Prisma.InvoiceGetPayload<{
  include: { payments: true; order: { include: { items: true } } }
}>

/**
 * Renders a minimal Invoice PDF: header fields, one line per Order item,
 * and the amount due. This is a foundation-milestone utility (M14), not a
 * templated PDF engine — no page-break/branding/multi-page handling.
 * Streams pdfkit's PDFDocument into a Buffer via the standard `data`/`end`
 * event-collection pattern (no existing precedent for this in the codebase).
 */
export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(18).text(`Invoice ${invoice.invoiceNumber}`, { underline: true })
    doc.moveDown()

    doc.fontSize(11)
    doc.text(`Order: ${invoice.order.orderNumber}`)
    doc.text(`Status: ${invoice.status}`)
    doc.text(`Issued: ${invoice.issuedAt?.toISOString() ?? 'N/A'}`)
    doc.text(`Due: ${invoice.dueAt?.toISOString() ?? 'N/A'}`)
    doc.moveDown()

    doc.fontSize(13).text('Order Items', { underline: true })
    doc.fontSize(11)
    for (const item of invoice.order.items) {
      doc.text(
        `${item.productVariantId}  x${item.quantity}  @ ${item.unitPriceSnapshot.toString()}` +
          `  = ${item.lineTotal.toString()}`,
      )
    }
    doc.moveDown()

    doc.fontSize(13).text(`Amount Due: ${invoice.amountDue.toString()}`, { underline: true })

    doc.end()
  })
}
