import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('associates its label and accepts typed input', async () => {
    render(<Textarea label="Notes" />)
    const textarea = screen.getByLabelText('Notes')

    await userEvent.type(textarea, 'Ships next week')

    expect(textarea).toHaveValue('Ships next week')
  })

  it('shows the error message instead of helper text', () => {
    render(<Textarea label="Notes" helperText="Optional" error="Notes are too long" />)

    expect(screen.getByText('Notes are too long')).toBeInTheDocument()
    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Textarea label="Notes" helperText="Optional" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
