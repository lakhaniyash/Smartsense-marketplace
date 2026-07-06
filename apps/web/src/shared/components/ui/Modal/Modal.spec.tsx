import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders its title/description when open and calls onOpenChange on close', async () => {
    const onOpenChange = vi.fn()
    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Delete order"
        description="This cannot be undone."
      >
        Body content
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'Delete order' })).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Delete order"
        description="This cannot be undone."
      />,
    )

    await userEvent.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders nothing when closed', () => {
    render(<Modal open={false} onOpenChange={() => {}} title="Delete order" description="x" />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { baseElement } = render(
      <Modal
        open
        onOpenChange={() => {}}
        title="Delete order"
        description="This cannot be undone."
      />,
    )

    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
