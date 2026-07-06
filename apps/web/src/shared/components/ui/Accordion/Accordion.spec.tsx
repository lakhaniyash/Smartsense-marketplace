import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Accordion } from './Accordion'

const items = [
  { value: 'shipping', trigger: 'Shipping address', content: <p>123 Main St</p> },
  { value: 'billing', trigger: 'Billing address', content: <p>456 Side St</p> },
]

describe('Accordion', () => {
  it('expands an item on click', async () => {
    render(<Accordion items={items} />)

    expect(screen.queryByText('123 Main St')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Shipping address' }))
    expect(screen.getByText('123 Main St')).toBeVisible()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Accordion items={items} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
