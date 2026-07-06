import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Radio } from './Radio'
import { RadioGroup } from './RadioGroup'

function ControlledGroup() {
  const [value, setValue] = useState('admin')
  return (
    <RadioGroup label="Role" value={value} onChange={setValue}>
      <Radio value="admin" label="Admin" />
      <Radio value="partner" label="Partner" />
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  it('renders a fieldset/legend and only one option checked at a time', async () => {
    render(<ControlledGroup />)

    expect(screen.getByRole('group', { name: 'Role' })).toBeInTheDocument()
    const admin = screen.getByRole('radio', { name: 'Admin' })
    const partner = screen.getByRole('radio', { name: 'Partner' })
    expect(admin).toBeChecked()

    await userEvent.click(partner)

    expect(partner).toBeChecked()
    expect(admin).not.toBeChecked()
  })

  it('throws if Radio is rendered outside a RadioGroup', () => {
    expect(() => render(<Radio value="admin" label="Admin" />)).toThrow(
      'Radio must be rendered inside a RadioGroup',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ControlledGroup />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
