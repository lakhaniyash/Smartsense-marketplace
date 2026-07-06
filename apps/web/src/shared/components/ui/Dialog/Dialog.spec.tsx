import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('calls onConfirm when the confirm action is clicked', async () => {
    const onConfirm = vi.fn()
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="Delete order"
        description="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('cancels by calling onOpenChange(false)', async () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="Delete order"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has no accessibility violations', async () => {
    const { baseElement } = render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="Delete order"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    )

    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
