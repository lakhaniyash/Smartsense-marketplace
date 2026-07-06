import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  it('renders the current context and user menu, and logs out on click', async () => {
    const onLogout = vi.fn()
    render(
      <Header
        title="SmartSense Marketplace"
        subtitle="Admin Console"
        userLabel="yash.lakhani@smartsensesolutions.com"
        userInitials="YL"
        onLogout={onLogout}
      />,
    )

    expect(screen.getByText('SmartSense Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Admin Console')).toBeInTheDocument()
    expect(screen.getByText('yash.lakhani@smartsensesolutions.com')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Header title="SmartSense Marketplace" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
