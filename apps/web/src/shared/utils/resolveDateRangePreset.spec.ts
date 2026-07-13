import { describe, expect, it } from 'vitest'
import { resolveDateRangePreset } from './resolveDateRangePreset'

// Fixed reference date - Wednesday, 15 July 2026 - clear of month/year
// boundaries so "this month"/"last month" assertions aren't coincidental.
const REFERENCE_DATE = new Date(2026, 6, 15)

describe('resolveDateRangePreset', () => {
  it('resolves "today" to a single-day range', () => {
    expect(resolveDateRangePreset('today', REFERENCE_DATE)).toEqual({
      from: '2026-07-15',
      to: '2026-07-15',
    })
  })

  it('resolves "last7Days" to a 7-day inclusive range ending today', () => {
    expect(resolveDateRangePreset('last7Days', REFERENCE_DATE)).toEqual({
      from: '2026-07-09',
      to: '2026-07-15',
    })
  })

  it('resolves "last30Days" to a 30-day inclusive range ending today', () => {
    expect(resolveDateRangePreset('last30Days', REFERENCE_DATE)).toEqual({
      from: '2026-06-16',
      to: '2026-07-15',
    })
  })

  it('resolves "thisMonth" to the 1st of the month through today', () => {
    expect(resolveDateRangePreset('thisMonth', REFERENCE_DATE)).toEqual({
      from: '2026-07-01',
      to: '2026-07-15',
    })
  })

  it('resolves "lastMonth" to the full previous calendar month', () => {
    expect(resolveDateRangePreset('lastMonth', REFERENCE_DATE)).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    })
  })

  it('rolls "lastMonth" back across a year boundary', () => {
    const january = new Date(2026, 0, 10)
    expect(resolveDateRangePreset('lastMonth', january)).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    })
  })
})
