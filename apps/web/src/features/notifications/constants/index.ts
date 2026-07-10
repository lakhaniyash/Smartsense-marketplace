// Single-scalar query, no per-poll list cost — fast enough to feel current
// without implying real-time-ness there's no WebSocket/subscription behind
// (explicitly out of scope for this milestone). Paused entirely while the
// tab is backgrounded (useIsDocumentVisible), so this is the foregrounded-tab
// cadence, not a permanent background cost.
export const UNREAD_COUNT_POLL_INTERVAL_MS = 45_000

// The header dropdown's fixed-size recent list — "View all" links to the
// full, paginated /notifications page for anything beyond this.
export const DROPDOWN_PAGE_SIZE = 5
