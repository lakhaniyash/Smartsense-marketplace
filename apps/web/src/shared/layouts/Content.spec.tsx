import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Content } from './Content'

describe('Content', () => {
  it('renders explicit children when given', () => {
    render(<Content>Order details</Content>)

    expect(screen.getByText('Order details')).toBeInTheDocument()
  })

  it('renders the routed page via Outlet when no children are given', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<Content />}>
            <Route path="/dashboard" element={<p>Dashboard page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Content>Order details</Content>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
