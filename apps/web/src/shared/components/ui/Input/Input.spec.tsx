import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('associates its label and accepts typed input', async () => {
    render(<Input label="Email" />)
    const input = screen.getByLabelText('Email')

    await userEvent.type(input, 'yash.lakhani+test@smartsensesolutions.com')

    expect(input).toHaveValue('yash.lakhani+test@smartsensesolutions.com')
  })

  it('shows helper text when there is no error', () => {
    render(<Input label="Email" helperText="We never share this" />)

    expect(screen.getByText('We never share this')).toBeInTheDocument()
  })

  it('shows the error message and marks the field invalid instead of the helper text', () => {
    render(<Input label="Email" helperText="We never share this" error="Email is required" />)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.queryByText('We never share this')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Input label="Email" helperText="We never share this" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
