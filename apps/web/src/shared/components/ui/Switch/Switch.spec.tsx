import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('associates its label and toggles on click', async () => {
    render(<Switch label="Enable notifications" />)
    const toggle = screen.getByRole('switch', { name: 'Enable notifications' })

    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Switch label="Enable notifications" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
