import type { ChangeEvent } from 'react'
import { useId, useState } from 'react'
import { resolveDateRangePreset, type DateRangePreset } from '@shared/utils'
import { Select, type SelectOption } from '../Select'

export interface DateRangeValue {
  from: string | undefined
  to: string | undefined
}

export interface DateRangePickerProps {
  label?: string
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
  // Order controls the Select's option order too. Defaults to every preset,
  // "Custom range…" last, matching the task's stated ordering.
  presets?: DateRangePreset[]
  // Only enforced against the two manually-edited custom-range inputs — a
  // computed preset (Last 30 days, etc.) is trusted by construction.
  maxRangeDays?: number
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  custom: 'Custom range…',
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  'today',
  'last7Days',
  'last30Days',
  'thisMonth',
  'lastMonth',
  'custom',
]

function daysBetween(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
}

// Two native `<input type="date">` elements plus a preset Select — not a
// calendar-grid widget. Same "native fits, use native" philosophy as Select's
// own doc comment (docs/ui-guidelines.md's ARIA Usage rule): a date is a
// native input type, a single-select list of presets is a native <select>,
// so no bespoke widget is warranted for either half of this control.
//
// The caller only ever receives concrete `{from, to}` ISO date strings —
// which preset (if any) produced them is this component's own, ephemeral UI
// state, never surfaced through `onChange`.
export function DateRangePicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  maxRangeDays,
}: DateRangePickerProps) {
  const groupId = useId()
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset | undefined>(() =>
    value.from !== undefined || value.to !== undefined ? 'custom' : undefined,
  )

  const options: SelectOption[] = presets.map((preset) => ({
    value: preset,
    label: PRESET_LABELS[preset],
  }))

  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    const preset = event.target.value as DateRangePreset
    setSelectedPreset(preset)
    if (preset === 'custom') {
      return
    }
    onChange(resolveDateRangePreset(preset))
  }

  function handleFromChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ from: event.target.value === '' ? undefined : event.target.value, to: value.to })
  }

  function handleToChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ from: value.from, to: event.target.value === '' ? undefined : event.target.value })
  }

  const showCustomInputs = selectedPreset === 'custom'
  const rangeError =
    showCustomInputs &&
    maxRangeDays !== undefined &&
    value.from !== undefined &&
    value.to !== undefined &&
    daysBetween(value.from, value.to) > maxRangeDays
      ? `Range can't exceed ${maxRangeDays} days.`
      : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          {...(label !== undefined ? { label } : { 'aria-label': 'Date range' })}
          options={options}
          placeholder="Select a range"
          value={selectedPreset ?? ''}
          onChange={handlePresetChange}
          className="w-44"
        />
        {showCustomInputs && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${groupId}-from`} className="text-fg-muted text-xs font-medium">
                From
              </label>
              <input
                id={`${groupId}-from`}
                type="date"
                value={value.from ?? ''}
                max={value.to}
                onChange={handleFromChange}
                aria-invalid={rangeError !== undefined || undefined}
                className="bg-surface text-fg-default border-border-control focus-visible:ring-focus-ring h-10 rounded-md border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${groupId}-to`} className="text-fg-muted text-xs font-medium">
                To
              </label>
              <input
                id={`${groupId}-to`}
                type="date"
                value={value.to ?? ''}
                min={value.from}
                onChange={handleToChange}
                aria-invalid={rangeError !== undefined || undefined}
                className="bg-surface text-fg-default border-border-control focus-visible:ring-focus-ring h-10 rounded-md border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              />
            </div>
          </>
        )}
      </div>
      {rangeError !== undefined && <p className="text-danger text-sm">{rangeError}</p>}
    </div>
  )
}
