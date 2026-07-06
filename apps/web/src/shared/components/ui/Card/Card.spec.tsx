import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'

describe('Card', () => {
  it('renders its composed sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Order #1234</CardTitle>
          <CardDescription>Placed 2 days ago</CardDescription>
        </CardHeader>
        <CardContent>Details go here</CardContent>
        <CardFooter>
          <button type="button">View</button>
        </CardFooter>
      </Card>,
    )

    expect(screen.getByRole('heading', { name: 'Order #1234' })).toBeInTheDocument()
    expect(screen.getByText('Placed 2 days ago')).toBeInTheDocument()
    expect(screen.getByText('Details go here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Order #1234</CardTitle>
        </CardHeader>
      </Card>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
