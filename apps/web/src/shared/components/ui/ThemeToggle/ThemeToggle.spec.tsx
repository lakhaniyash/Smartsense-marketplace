import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

function matchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

function ResolvedTheme() {
  const { resolvedTheme } = useTheme()
  return <span data-testid="resolved">{resolvedTheme}</span>
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.matchMedia = matchMedia(false)
})

describe('ThemeToggle / ThemeProvider', () => {
  it('cycles light -> dark -> system on repeated clicks and applies the dark class', async () => {
    localStorage.setItem('smartsense-theme', 'light')
    render(
      <ThemeProvider>
        <ThemeToggle />
        <ResolvedTheme />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: /Theme: Light theme/ }))
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: /Theme: Dark theme/ }))
    expect(screen.getByRole('button', { name: /Theme: System theme/ })).toBeInTheDocument()
  })

  it('persists the chosen mode across a remount', async () => {
    localStorage.setItem('smartsense-theme', 'light')
    const { unmount } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /Theme: Light theme/ }))
    unmount()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /Theme: Dark theme/ })).toBeInTheDocument()
  })

  it('throws when useTheme is used outside a ThemeProvider', () => {
    expect(() => render(<ResolvedTheme />)).toThrow('useTheme must be used within a ThemeProvider')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
