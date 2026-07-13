export type DateRangePreset =
  'today' | 'last7Days' | 'last30Days' | 'thisMonth' | 'lastMonth' | 'custom'

export interface ResolvedDateRange {
  from: string
  to: string
}

// yyyy-mm-dd in the *local* timezone — `Date#toISOString` would shift the
// date backwards for any timezone ahead of UTC once past midnight-to-6am
// local time, which is exactly wrong for a "Today" preset.
function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

// Concrete-dates resolver for DateRangePicker's presets (Today/Last 7 days/
// Last 30 days/This month/Last month) — the consumer only ever sees `{from,
// to}`, never which preset produced it (DateRangePicker.tsx). "Custom range"
// has no fixed resolution (the two date inputs drive it directly), so it's
// not handled here.
export function resolveDateRangePreset(
  preset: Exclude<DateRangePreset, 'custom'>,
  today: Date = new Date(),
): ResolvedDateRange {
  const now = startOfDay(today)

  switch (preset) {
    case 'today':
      return { from: toIsoDate(now), to: toIsoDate(now) }
    case 'last7Days':
      return { from: toIsoDate(addDays(now, -6)), to: toIsoDate(now) }
    case 'last30Days':
      return { from: toIsoDate(addDays(now, -29)), to: toIsoDate(now) }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toIsoDate(start), to: toIsoDate(now) }
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toIsoDate(start), to: toIsoDate(end) }
    }
    default: {
      const exhaustiveCheck: never = preset
      throw new Error(`Unhandled date range preset: ${String(exhaustiveCheck)}`)
    }
  }
}
