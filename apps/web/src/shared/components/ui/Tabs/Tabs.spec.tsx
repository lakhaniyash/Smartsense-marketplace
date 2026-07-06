import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Tabs } from './Tabs'

const items = [
  { value: 'details', label: 'Details', content: <p>Order details</p> },
  { value: 'timeline', label: 'Timeline', content: <p>Order timeline</p> },
]

describe('Tabs', () => {
  it('shows the first tab by default and switches on click', async () => {
    render(<Tabs items={items} />)

    expect(screen.getByText('Order details')).toBeVisible()
    await userEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    expect(screen.getByText('Order timeline')).toBeVisible()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Tabs items={items} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
