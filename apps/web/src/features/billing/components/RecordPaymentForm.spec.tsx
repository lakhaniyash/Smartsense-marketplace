import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { PaymentMethod } from '@lib/graphql/__generated__/graphql'
import { RecordPaymentForm } from './RecordPaymentForm'

// RecordPaymentForm is deliberately presentational — it owns collection and
// client-side (Zod) validation of the three user-entered fields, while the
// recordPayment mutation + idempotencyKey stay in InvoiceDetailPage
// (RecordPaymentForm.tsx's own doc comment). These specs cover exactly the
// three paths docs/testing.md § Form Testing requires: validation-error,
// success (onSubmit called with the expected values), and loading/disabled.
function renderForm(props: Partial<React.ComponentProps<typeof RecordPaymentForm>> = {}) {
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <RecordPaymentForm
      open
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={false}
      {...props}
    />,
  )
  return { onSubmit, onOpenChange }
}

describe('RecordPaymentForm', () => {
  it('surfaces the Zod required-field errors for whitespace-only input', async () => {
    // The native `required` attribute blocks a truly empty submit before the
    // event even fires, so whitespace-only values are used to get past it and
    // exercise the schema's own `.trim().min(1)` messages — the layer this
    // form actually owns.
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/Amount/), '   ')
    await user.type(screen.getByLabelText(/External transaction ID/), '   ')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(await screen.findByText('Amount is required')).toBeInTheDocument()
    expect(screen.getByText('External transaction ID is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a non-positive / malformed amount', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/Amount/), '0')
    await user.type(screen.getByLabelText(/External transaction ID/), 'TX-ABC')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(
      await screen.findByText('Enter a positive amount with up to 2 decimal places'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the trimmed, typed values on a valid submission', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/Amount/), '100.50')
    await user.type(screen.getByLabelText(/External transaction ID/), '  TX-9001  ')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      amount: '100.50',
      method: PaymentMethod.Card,
      externalTransactionId: 'TX-9001',
    })
  })

  it('disables every control while a submission is in flight', () => {
    renderForm({ isSubmitting: true })

    // The <fieldset disabled> wraps every field including Cancel, so a single
    // control proves the whole form is locked (RecordPaymentForm.tsx comment).
    expect(screen.getByLabelText(/Amount/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('has no accessibility violations', async () => {
    const { baseElement } = render(
      <RecordPaymentForm open onOpenChange={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />,
    )

    // The dialog renders into a portal, so scope axe to the whole document.
    expect(await axe(baseElement)).toHaveNoViolations()
  })
})
