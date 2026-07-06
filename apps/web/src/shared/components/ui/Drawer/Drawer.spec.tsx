import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('renders its title/content and calls onOpenChange on close', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open onOpenChange={onOpenChange} title="Order #1234">
        Order detail content
      </Drawer>,
    )

    expect(screen.getByRole('dialog', { name: 'Order #1234' })).toBeInTheDocument()
    expect(screen.getByText('Order detail content')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has no accessibility violations', async () => {
    const { baseElement } = render(
      <Drawer open onOpenChange={() => {}} title="Order #1234">
        Content
      </Drawer>,
    )

    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
