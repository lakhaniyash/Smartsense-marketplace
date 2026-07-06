import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ToastProvider, useToast } from './ToastProvider'

function TriggerToast() {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast({ title: 'Order saved', variant: 'success' })}>
      Save
    </button>
  )
}

describe('ToastProvider / useToast', () => {
  it('renders a toast after toast() is called and dismisses it on close', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Order saved')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Order saved')).not.toBeInTheDocument()
  })

  it('throws when useToast is used outside a ToastProvider', () => {
    expect(() => render(<TriggerToast />)).toThrow('useToast must be used within a ToastProvider')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
