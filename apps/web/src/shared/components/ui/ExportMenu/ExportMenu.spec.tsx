import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { ExportMenu } from './ExportMenu'

describe('ExportMenu', () => {
  it('calls onExport("csv") when "Export as CSV" is chosen', async () => {
    const onExport = vi.fn()
    render(<ExportMenu onExport={onExport} />)

    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export as CSV' }))

    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport).toHaveBeenCalledWith('csv')
  })

  it('disables Excel export by default with a discoverable reason, and never calls onExport for it', async () => {
    const onExport = vi.fn()
    render(<ExportMenu onExport={onExport} />)

    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    const excelItem = await screen.findByRole('menuitem', { name: 'Export as Excel' })

    expect(excelItem).toHaveAttribute('data-disabled')
    expect(screen.getByTitle('Excel export coming soon')).toBeInTheDocument()

    await userEvent.click(excelItem)
    expect(onExport).not.toHaveBeenCalled()
  })

  it('allows a caller to re-enable Excel via disabledFormats', async () => {
    const onExport = vi.fn()
    render(<ExportMenu onExport={onExport} disabledFormats={[]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export as Excel' }))

    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport).toHaveBeenCalledWith('excel')
  })

  it('drives the trigger Button isLoading state from isExporting', () => {
    render(<ExportMenu onExport={vi.fn()} isExporting />)

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-busy', 'true')
  })

  it('has no accessibility violations when open', async () => {
    const { container } = render(<ExportMenu onExport={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await screen.findByRole('menuitem', { name: 'Export as CSV' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
