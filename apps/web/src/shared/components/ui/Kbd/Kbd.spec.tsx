import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Kbd } from './Kbd'

describe('Kbd', () => {
  it('renders a native <kbd> element with its children', () => {
    render(<Kbd>Ctrl K</Kbd>)

    const kbd = screen.getByText('Ctrl K')
    expect(kbd.tagName).toBe('KBD')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Kbd>Esc</Kbd>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
