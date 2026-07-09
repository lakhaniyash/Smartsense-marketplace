import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Popover } from './Popover'

describe('Popover', () => {
  it('opens on trigger click and shows its content', async () => {
    render(
      <Popover trigger={<button type="button">Open panel</button>}>
        <p>Panel content</p>
      </Popover>,
    )

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }))
    expect(await screen.findByText('Panel content')).toBeInTheDocument()
  })

  it('has no accessibility violations when open', async () => {
    const { container } = render(
      <Popover trigger={<button type="button">Open panel</button>}>
        <p>Panel content</p>
      </Popover>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }))
    await screen.findByText('Panel content')
    expect(await axe(container)).toHaveNoViolations()
  })
})
