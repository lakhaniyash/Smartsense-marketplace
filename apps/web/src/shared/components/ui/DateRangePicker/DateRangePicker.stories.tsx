import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateRangePicker, type DateRangeValue } from './DateRangePicker'

const meta: Meta<typeof DateRangePicker> = {
  title: 'UI/DateRangePicker',
  component: DateRangePicker,
}

export default meta
type Story = StoryObj<typeof DateRangePicker>

function DateRangePickerDemo(props: { maxRangeDays?: number }) {
  const [value, setValue] = useState<DateRangeValue>({ from: undefined, to: undefined })

  return <DateRangePicker label="Reporting period" value={value} onChange={setValue} {...props} />
}

export const Default: Story = {
  render: () => <DateRangePickerDemo />,
}

export const WithMaxRange: Story = {
  render: () => <DateRangePickerDemo maxRangeDays={90} />,
  parameters: {
    docs: {
      description: {
        story: 'Selecting "Custom range…" and exceeding `maxRangeDays` shows an inline error.',
      },
    },
  },
}

export const PrefilledCustomRange: Story = {
  render: function Render() {
    const [value, setValue] = useState<DateRangeValue>({ from: '2026-06-01', to: '2026-06-30' })
    return <DateRangePicker label="Reporting period" value={value} onChange={setValue} />
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the incoming value already has concrete dates (e.g. restored from a URL param), the picker opens straight into the custom-range inputs.',
      },
    },
  },
}
