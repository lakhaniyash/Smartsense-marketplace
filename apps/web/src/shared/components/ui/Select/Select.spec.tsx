import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Select } from './Select'

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'partner', label: 'Partner' },
]

describe('Select', () => {
  it('associates its label and lets the user pick an option', async () => {
    render(<Select label="Role" options={options} />)
    const select = screen.getByLabelText('Role')

    await userEvent.selectOptions(select, 'partner')

    expect(select).toHaveValue('partner')
  })

  it('shows a disabled placeholder option when provided', () => {
    const { container } = render(
      <Select label="Role" options={options} placeholder="Choose a role" />,
    )
    const placeholderOption = container.querySelector('option[value=""]')

    expect(placeholderOption).toHaveTextContent('Choose a role')
    expect(placeholderOption).toBeDisabled()
  })

  it('lets the user reselect a clearable placeholder after choosing a value (filter usage)', async () => {
    render(<Select label="Status" options={options} placeholder="All statuses" clearable />)
    const select = screen.getByLabelText('Status')

    await userEvent.selectOptions(select, 'partner')
    expect(select).toHaveValue('partner')

    await userEvent.selectOptions(select, '')
    expect(select).toHaveValue('')
  })

  it('shows the error message instead of helper text', () => {
    render(<Select label="Role" options={options} helperText="Pick one" error="Role is required" />)

    expect(screen.getByText('Role is required')).toBeInTheDocument()
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Select label="Role" options={options} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
