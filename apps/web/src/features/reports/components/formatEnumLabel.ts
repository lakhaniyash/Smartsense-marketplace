// Converts a GraphQL enum value (SCREAMING_SNAKE_CASE) into a human label,
// e.g. "PARTIALLY_PAID" -> "Partially paid" — shared by every chart wrapper
// that labels its axis/slices from a raw enum value (OrdersTrendChart,
// NotificationActivityChart).
export function formatEnumLabel(value: string): string {
  const [first, ...rest] = value.toLowerCase().split('_')
  const capitalizedFirst = first !== undefined ? first.charAt(0).toUpperCase() + first.slice(1) : ''
  return [capitalizedFirst, ...rest].join(' ')
}
