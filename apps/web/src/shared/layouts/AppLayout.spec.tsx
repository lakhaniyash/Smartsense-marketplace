import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('composes header, sidebar, and content together', () => {
    render(
      <AppLayout header={<p>Header</p>} sidebar={<p>Sidebar</p>}>
        <p>Content</p>
      </AppLayout>,
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AppLayout header={<p>Header</p>}>
        <p>Content</p>
      </AppLayout>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
