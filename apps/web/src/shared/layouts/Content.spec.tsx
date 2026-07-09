import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Content } from './Content'

describe('Content', () => {
  it('renders explicit children when given', () => {
    render(<Content>Order details</Content>)

    expect(screen.getByText('Order details')).toBeInTheDocument()
  })

  it('renders the routed page via Outlet when no children are given', () => {
    // Breadcrumbs (rendered inside Content) reads useMatches(), which only
    // works under a data router (createMemoryRouter) — the declarative
    // <MemoryRouter>/<Routes> API this test used before doesn't support it,
    // and matches our real router (app/router/index.tsx uses
    // createBrowserRouter, the same data-router family).
    const router = createMemoryRouter(
      [
        {
          element: <Content />,
          children: [{ path: '/dashboard', element: <p>Dashboard page</p> }],
        },
      ],
      { initialEntries: ['/dashboard'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Content>Order details</Content>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
