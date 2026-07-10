// URL-backed filter state for the notification list — same pattern as
// InvoiceFilters/OrderFilters (docs/frontend-architecture.md § State
// Management Strategy). 'all' maps to omitting `status` from the
// NotificationFilterInput sent to the backend, not a third enum value on
// the wire — the schema's NotificationStatus only has UNREAD/READ.
export type NotificationReadFilter = 'all' | 'unread' | 'read'
