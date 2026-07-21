import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartDataset as ChartJsDataset,
  type ChartOptions,
} from 'chart.js'
import { Chart as ReactChart } from 'react-chartjs-2'
import { useTheme } from '../ThemeToggle'
import { EmptyState } from '../EmptyState'
import { CHART_PALETTE, type ChartColorRole, type ChartPalette } from './Chart.constants'

// Registered once, at module scope, so every consumer of this wrapper shares
// one registration call - and only the controllers/elements this project
// actually uses (never `chart.js/auto`, which pulls in every chart type
// Chart.js ships and bloats the bundle for chart types nothing here renders).
// Each chart type needs BOTH its element AND its controller registered
// (Chart.js's tree-shakeable API treats them as separate registrables) -
// elements alone render nothing and throw "<type> is not a registered
// controller" the moment react-chartjs-2 tries to instantiate one.
//
// This exact list going stale is regression-tested by
// Chart.controllers.spec.ts, NOT by this file's own Chart.spec.tsx render
// tests - importing 'react-chartjs-2' at all incidentally registers every
// controller as a side effect of its own unrelated named exports, which
// masks a missing entry here under Vitest (see that spec file's own
// comment for the full mechanism, and CI's Playwright suite for how this
// exact gap once reached production undetected).
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
)

export type ChartKind = 'line' | 'bar' | 'doughnut'

export interface ChartDataset {
  label: string
  data: number[]
  colorRole?: ChartColorRole
}

export interface ChartProps {
  type: ChartKind
  labels: string[]
  datasets: ChartDataset[]
  height?: number
  // Canvas has no accessible content of its own (docs/ui-guidelines.md § ARIA
  // Usage) - this becomes the accessible name of the `role="img"` wrapper.
  ariaLabel: string
  isEmpty?: boolean
}

// Cycle order for datasets/slices that don't specify a `colorRole` -
// status colors (danger/warning) last so a caller who *does* care about
// severity semantics still has to opt in explicitly via `colorRole`.
const DEFAULT_ROLE_CYCLE: ChartColorRole[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'danger',
]

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// `DEFAULT_ROLE_CYCLE[index % length]` is always in-bounds, but
// noUncheckedIndexedAccess types it as possibly-undefined - the trailing
// `?? 'primary'` is an unreachable-in-practice fallback that keeps this a
// plain `ChartColorRole`, not a defensive branch expected to ever run.
function roleForIndex(index: number, override: ChartColorRole | undefined): ChartColorRole {
  return override ?? DEFAULT_ROLE_CYCLE[index % DEFAULT_ROLE_CYCLE.length] ?? 'primary'
}

function buildChartData(
  type: ChartKind,
  labels: string[],
  datasets: ChartDataset[],
  palette: ChartPalette,
): ChartData<ChartKind, number[], string> {
  if (type === 'doughnut') {
    const [dataset] = datasets
    const sliceColors = labels.map((_, index) => palette[roleForIndex(index, undefined)])
    return {
      labels,
      datasets: [
        {
          label: dataset?.label ?? '',
          data: dataset?.data ?? [],
          backgroundColor: sliceColors,
        } as ChartJsDataset<ChartKind, number[]>,
      ],
    }
  }

  return {
    labels,
    datasets: datasets.map((dataset, index) => {
      const color = palette[roleForIndex(index, dataset.colorRole)]

      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: type === 'line' ? hexToRgba(color, 0.15) : color,
        ...(type === 'line' && { tension: 0.3, pointRadius: 3, fill: true }),
        ...(type === 'bar' && { borderRadius: 4 }),
      } as ChartJsDataset<ChartKind, number[]>
    }),
  }
}

function buildChartOptions(
  type: ChartKind,
  datasets: ChartDataset[],
  palette: ChartPalette,
): ChartOptions<ChartKind> {
  return {
    responsive: true,
    // Chart.js's own ResizeObserver handles width reflow against the parent
    // element - the wrapper below sets an explicit height instead of an
    // aspect ratio.
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'doughnut' || datasets.length > 1,
        labels: { color: palette.text },
      },
      tooltip: {
        backgroundColor: palette.text,
      },
    },
    // `scales` has no meaning for an arc-based doughnut - omitted entirely
    // (via conditional spread) rather than set to `undefined`, since
    // `exactOptionalPropertyTypes` treats "key present with value undefined"
    // and "key absent" as different things.
    ...(type !== 'doughnut' && {
      scales: {
        x: { grid: { color: palette.grid }, ticks: { color: palette.text } },
        y: { grid: { color: palette.grid }, ticks: { color: palette.text } },
      },
    }),
  }
}

// One generic Chart.js wrapper for every chart in the app - not separate
// LineChart/BarChart/DoughnutChart components - so there is exactly one
// Chart.js registration path and one place applying the dark-mode palette
// and the "no data" empty-state branch (M15 plan § Architectural Decisions).
//
// Chart.js draws to a <canvas>, which cannot read a CSS custom property or a
// Tailwind `dark:` class, so the light/dark palette (Chart.constants.ts) is
// re-applied by hand on every theme toggle via `useTheme()` - this is a
// deliberate divergence from every other component in the design system,
// which never touches color directly (docs/ui-guidelines.md § Dark Mode).
export function Chart({ type, labels, datasets, height = 280, ariaLabel, isEmpty }: ChartProps) {
  const { resolvedTheme } = useTheme()
  const palette = CHART_PALETTE[resolvedTheme]

  if (isEmpty === true) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <EmptyState title="No data for this period" description="Try a different date range." />
      </div>
    )
  }

  const data = buildChartData(type, labels, datasets, palette)
  const options = buildChartOptions(type, datasets, palette)

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      {/* react-chartjs-2 defaults the canvas itself to role="img" - overridden
          to "presentation" here so the accessible name lives exactly once,
          on this wrapper, instead of a nested (and unlabelled) img role. */}
      <ReactChart type={type} data={data} options={options} role="presentation" />
    </div>
  )
}
