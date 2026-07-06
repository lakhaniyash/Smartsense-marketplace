import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('associates its label and toggles on click', async () => {
    render(<Checkbox label="Accept terms" />)
    const checkbox = screen.getByLabelText('Accept terms')

    expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('applies the indeterminate DOM property via ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} label="Select all" indeterminate />)

    expect(ref.current?.indeterminate).toBe(true)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Checkbox label="Accept terms" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
