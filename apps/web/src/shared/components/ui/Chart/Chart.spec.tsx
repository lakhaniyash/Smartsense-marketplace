import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../ThemeToggle'
import { Chart } from './Chart'

// jsdom implements no canvas rendering backend at all, so
// HTMLCanvasElement#getContext('2d') returns null - Chart.js would throw
// "Failed to create chart: can't acquire context from the given item"
// without this. This stub only needs to satisfy the drawing calls Chart.js
// makes during construction/render, not produce real pixels - this is the
// standard, dependency-free way this ecosystem tests react-chartjs-2/canvas
// consumers under jsdom (an alternative would be the native `canvas`
// package, which needs system-level build tooling this project doesn't
// otherwise require).
function stub2dContext() {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
  }
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    stub2dContext,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext
})

function renderWithTheme(ui: ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// These tests prove RENDERING works today - they do not prove Chart.tsx's
// controller-registration list stays complete, since importing
// react-chartjs-2 at all (as this file does) incidentally registers every
// controller regardless of what Chart.tsx itself registers. That's
// Chart.controllers.spec.ts's job, in the same directory.
describe('Chart', () => {
  it('renders a canvas under an accessible role="img" wrapper - a real Chart.js/React 19 render, not an assumption', () => {
    renderWithTheme(
      <Chart
        type="line"
        labels={['Mon', 'Tue', 'Wed']}
        datasets={[{ label: 'Revenue', data: [10, 20, 15] }]}
        ariaLabel="Revenue trend"
      />,
    )

    const wrapper = screen.getByRole('img', { name: 'Revenue trend' })
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders a bar chart with multiple datasets', () => {
    renderWithTheme(
      <Chart
        type="bar"
        labels={['Q1', 'Q2']}
        datasets={[
          { label: 'Orders', data: [5, 8], colorRole: 'primary' },
          { label: 'Returns', data: [1, 2], colorRole: 'danger' },
        ]}
        ariaLabel="Orders vs returns"
      />,
    )

    expect(screen.getByRole('img', { name: 'Orders vs returns' })).toBeInTheDocument()
  })

  it('renders a doughnut chart', () => {
    renderWithTheme(
      <Chart
        type="doughnut"
        labels={['In stock', 'Low stock', 'Out of stock']}
        datasets={[{ label: 'Inventory', data: [40, 5, 2] }]}
        ariaLabel="Inventory status"
      />,
    )

    expect(screen.getByRole('img', { name: 'Inventory status' })).toBeInTheDocument()
  })

  it('renders the shared EmptyState instead of mounting Chart.js when isEmpty', () => {
    renderWithTheme(
      <Chart type="line" labels={[]} datasets={[]} ariaLabel="Revenue trend" isEmpty />,
    )

    expect(screen.queryByRole('img', { name: 'Revenue trend' })).not.toBeInTheDocument()
    expect(screen.getByText('No data for this period')).toBeInTheDocument()
    expect(document.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <Chart
        type="line"
        labels={['Mon', 'Tue']}
        datasets={[{ label: 'Revenue', data: [10, 20] }]}
        ariaLabel="Revenue trend"
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
