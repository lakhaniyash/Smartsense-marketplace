// Promoted from seven byte-for-byte identical private encodeCursor/decodeCursor
// pairs (Billing/Catalog/Customers/Notifications/Orders/Reports/Users) —
// CLAUDE.md "Promote, don't pre-share: code moves to shared/ on the second
// real consumer." Behavior is unchanged; each service now calls this instead
// of its own private copy (v1.0 Release Readiness Audit finding F-M12).
// Reports' separate offset-based cursor (encodeOffsetCursor/decodeOffsetCursor,
// for the one report whose groupBy can't use a real id) has exactly one
// consumer today, so it stays private there rather than being promoted here.
export function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64')
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8')
}
