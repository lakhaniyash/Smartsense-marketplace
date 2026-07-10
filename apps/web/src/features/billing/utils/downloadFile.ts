// No existing precedent for a file download in this codebase (first one
// ships with M14/Billing) — kept minimal per the plan: Blob -> object URL ->
// a programmatic <a> click -> revoke, rather than reaching for a dependency.
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// `invoicePdf` returns the PDF's bytes base64-encoded (see
// apps/api/src/schema.gql's doc comment on that field) — this reverses the
// encoding client-side so the bytes can be wrapped in a `Blob` unchanged.
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
