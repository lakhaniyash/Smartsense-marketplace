import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Radio } from './Radio'
import { RadioGroup } from './RadioGroup'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState('admin')
      return (
        <RadioGroup label="Role" value={value} onChange={setValue}>
          <Radio value="admin" label="Admin" />
          <Radio value="partner" label="Partner" />
          <Radio value="customer" label="Customer" />
        </RadioGroup>
      )
    }
    return <Example />
  },
}
