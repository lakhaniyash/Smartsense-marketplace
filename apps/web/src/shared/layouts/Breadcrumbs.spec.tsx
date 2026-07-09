import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BreadcrumbProvider, Breadcrumbs, useBreadcrumb } from './Breadcrumbs'

function ProductPage({ title }: { title: string | undefined }) {
  useBreadcrumb(title)
  return <p>Product page</p>
}

function renderAt(initialPath: string, title: string | undefined = undefined) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Outlet />
          </BreadcrumbProvider>
        ),
        children: [
          {
            path: '/dashboard',
            element: <p>Dashboard page</p>,
          },
          {
            path: '/catalog/:id',
            element: <ProductPage title={title} />,
            handle: { crumb: [{ label: 'Catalog', href: '/catalog' }, { label: 'Product' }] },
          },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('Breadcrumbs', () => {
  it('renders nothing on a route with no handle.crumb', () => {
    renderAt('/dashboard')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })

  it('renders the static crumb trail from route handle metadata', () => {
    renderAt('/catalog/123')
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '/catalog')
    expect(screen.getByText('Product')).toHaveAttribute('aria-current', 'page')
  })

  it('replaces the trailing crumb once the page publishes a real title', () => {
    renderAt('/catalog/123', 'Wireless Mouse')
    expect(screen.getByText('Wireless Mouse')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByText('Product')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderAt('/catalog/123')
    expect(await axe(container)).toHaveNoViolations()
  })
})
