import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('renders centered children and an optional footer', () => {
    render(
      <AuthLayout footer={<p>&copy; SmartSense Marketplace</p>}>
        <p>Sign in form</p>
      </AuthLayout>,
    )

    expect(screen.getByText('Sign in form')).toBeInTheDocument()
    expect(screen.getByText('© SmartSense Marketplace')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AuthLayout>
        <p>Sign in form</p>
      </AuthLayout>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
