import { Chart as ChartJS } from 'chart.js'
import { describe, expect, it, vi } from 'vitest'

// Regression test for the bug fixed by this repo's Chart.tsx controller
// registration commit ("bar" is not a registered controller — every chart
// type was actually broken in production; Chart.spec.tsx's own render
// tests never caught it).
//
// A plain assertion against ChartJS.registry in Chart.spec.tsx CANNOT
// reliably catch a regression here: importing anything from
// 'react-chartjs-2' executes that module's top-level `Line`/`Bar`/
// `Doughnut` consts (its dist/index.js), each of which calls
// `Chart.register(...)` as a side effect of merely being *defined* — not
// used. Chart.tsx imports the generic `Chart` from 'react-chartjs-2'
// regardless, so that side effect fires in ANY Vitest test that imports
// Chart.tsx at all, independent of whether Chart.tsx's own explicit
// registration list is correct. That's the exact mechanism that let the
// original bug ship undetected: Vitest's unbundled ESM masks the gap that
// only the production Vite build's tree-shaking (which drops those unused
// named exports) exposes.
//
// This file breaks that masking on purpose: replacing 'react-chartjs-2'
// with a stub that never touches its real exports means the only thing
// left that can register a controller is Chart.tsx's own explicit
// `ChartJS.register(...)` call. If a future edit drops one of
// BarController/LineController/DoughnutController from that list, this
// test fails — Chart.spec.tsx's existing render tests would not.
vi.mock('react-chartjs-2', () => ({
  Chart: () => null,
}))

describe('Chart.js controller registration (isolated from react-chartjs-2 masking)', () => {
  it('registers a controller for every ChartKind this app renders', async () => {
    await import('./Chart')

    expect(() => ChartJS.registry.getController('bar')).not.toThrow()
    expect(() => ChartJS.registry.getController('line')).not.toThrow()
    expect(() => ChartJS.registry.getController('doughnut')).not.toThrow()
  })
})
