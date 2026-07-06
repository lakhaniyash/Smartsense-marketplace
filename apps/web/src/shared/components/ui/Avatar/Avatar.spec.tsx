import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders initials when no image is set', async () => {
    render(<Avatar initials="YL" />)

    expect(await screen.findByText('YL')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Avatar initials="YL" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
