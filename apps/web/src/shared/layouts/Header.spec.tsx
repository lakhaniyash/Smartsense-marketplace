import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { ThemeProvider } from '@shared/components'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  it('renders the current context and opens search on click', async () => {
    const onOpenSearch = vi.fn()
    render(
      <ThemeProvider>
        <Header
          title="SmartSense Marketplace"
          subtitle="Admin Console"
          onOpenSearch={onOpenSearch}
        />
      </ThemeProvider>,
    )

    expect(screen.getByText('SmartSense Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Admin Console')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('textbox', { name: 'Search everything (Ctrl+K)' }))
    expect(onOpenSearch).toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider>
        <Header title="SmartSense Marketplace" />
      </ThemeProvider>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
