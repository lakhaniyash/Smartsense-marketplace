import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { DateRangePicker, type DateRangeValue } from './DateRangePicker'

// A thin controlled wrapper - DateRangePicker is a pure controlled component,
// so exercising it as a consumer would (state lives in the parent) is the
// only way to observe the full preset -> onChange -> re-render loop.
function ControlledDateRangePicker({
  onChange,
  maxRangeDays,
}: {
  onChange?: (range: DateRangeValue) => void
  maxRangeDays?: number
}) {
  const [value, setValue] = useState<DateRangeValue>({ from: undefined, to: undefined })

  return (
    <DateRangePicker
      label="Period"
      value={value}
      {...(maxRangeDays !== undefined && { maxRangeDays })}
      onChange={(range) => {
        setValue(range)
        onChange?.(range)
      }}
    />
  )
}

describe('DateRangePicker', () => {
  it('calls onChange with concrete dates when a preset is selected, without exposing the preset', async () => {
    const onChange = vi.fn()
    render(<ControlledDateRangePicker onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Period'), 'today')

    expect(onChange).toHaveBeenCalledTimes(1)
    const [range] = onChange.mock.calls[0] as [DateRangeValue]
    expect(range.from).toBe(range.to)
    expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('reveals the two date inputs only once "Custom range…" is selected', async () => {
    render(<ControlledDateRangePicker />)

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Period'), 'custom')

    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('calls onChange with the edited value when a custom date input changes', async () => {
    const onChange = vi.fn()
    render(<ControlledDateRangePicker onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Period'), 'custom')
    onChange.mockClear()

    const fromInput = screen.getByLabelText('From')
    fireEvent.change(fromInput, { target: { value: '2026-01-05' } })

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1) as [DateRangeValue]
    expect(lastCall[0].from).toBe('2026-01-05')
  })

  it('shows a validation message once a custom range exceeds maxRangeDays', async () => {
    render(<ControlledDateRangePicker maxRangeDays={7} />)
    await userEvent.selectOptions(screen.getByLabelText('Period'), 'custom')

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-02-01' } })

    expect(await screen.findByText("Range can't exceed 7 days.")).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ControlledDateRangePicker />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
