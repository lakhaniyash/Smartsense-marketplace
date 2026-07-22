import { describe, expect, it } from 'vitest'
import { resolveReportDateRangeParams } from './index'

// Regression coverage for the bug this function fixes: an Admin caller
// landing on any date-ranged report page with no `from`/`to` in the URL used
// to send an unbounded query, which reports.service.ts's own
// `requireBoundedDateRangeForAdmin` guard (F-C2) rejects with a
// BadRequestException — surfaced by reports.spec.ts's Admin E2E test failing
// with "Couldn't load the reports dashboard".
describe('resolveReportDateRangeParams', () => {
  it('falls back to a trailing 30-day window when the URL has neither from nor to', () => {
    const { from, to } = resolveReportDateRangeParams(new URLSearchParams())

    const fromDate = new Date(from)
    const toDate = new Date(to)
    const daySpan = Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
    expect(daySpan).toBe(29)
  })

  it('falls back when only one of from/to is present in the URL', () => {
    const { from, to } = resolveReportDateRangeParams(new URLSearchParams('from=2026-01-01'))

    expect(from).not.toBe('2026-01-01')
    expect(to).not.toBe('')
  })

  it('uses the explicit from/to from the URL when both are present', () => {
    const result = resolveReportDateRangeParams(
      new URLSearchParams('from=2026-01-01&to=2026-01-31'),
    )

    expect(result).toEqual({ from: '2026-01-01', to: '2026-01-31' })
  })
})
