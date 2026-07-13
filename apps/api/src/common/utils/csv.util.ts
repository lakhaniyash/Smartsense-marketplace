// Promoted from BillingService's private exportInvoicesCsv/escapeCsvField
// (M14) once Reports' exportReport (M15) became a second consumer —
// CLAUDE.md "Promote, don't pre-share: code moves to shared/ on the second
// real consumer." Behavior is unchanged from the original Billing
// implementation; Billing now calls this instead of its own private copy.
export function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/** Builds a full CSV document (header row + data rows) from raw field values. */
export function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map((header) => escapeCsvField(header)).join(',')
  const rowLines = rows.map((row) => row.map((field) => escapeCsvField(field)).join(','))
  return [headerLine, ...rowLines].join('\n')
}
