import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('disables Previous on the first page and calls onNext', async () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    render(
      <Pagination hasPreviousPage={false} hasNextPage onPrevious={onPrevious} onNext={onNext} />,
    )

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  it('disables Next on the last page', () => {
    render(
      <Pagination hasPreviousPage hasNextPage={false} onPrevious={() => {}} onNext={() => {}} />,
    )

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Pagination hasPreviousPage hasNextPage onPrevious={() => {}} onNext={() => {}} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
