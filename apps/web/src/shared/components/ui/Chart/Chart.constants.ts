export type ChartColorRole = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning'

export interface ChartPalette {
  primary: string
  secondary: string
  tertiary: string
  danger: string
  success: string
  warning: string
  // Gridlines and axis ticks/legend text - Chart.js draws directly to
  // <canvas>, which cannot read a CSS custom property or a Tailwind `dark:`
  // variant, so these must be plain hex values kept in sync with
  // apps/web/src/index.css BY HAND. If a token in index.css's `:root`/`.dark`
  // blocks changes, this file must change with it in the same PR.
  grid: string
  text: string
}

// Sourced from apps/web/src/index.css's semantic tokens (which themselves
// resolve to Tailwind v4's default `--color-{name}-{shade}` primitives,
// apps/web/node_modules/tailwindcss/theme.css). Tailwind v4 expresses its
// palette in oklch(); the hex values below are that palette's own sRGB
// equivalents (converted once, not eyeballed), so a value here is always
// traceable to a real token:
//   - primary  -> blue-600/500   (same hue as --color-info)
//   - danger   -> red-600/500    (== --color-danger)
//   - success  -> green-600/500  (== --color-success)
//   - warning  -> amber-600/500  (== --color-warning)
//   - grid     -> gray-200/800   (== --color-border-default)
//   - text     -> gray-500/400   (== --color-fg-muted)
// index.css has no "secondary"/"tertiary" semantic token (no brand color
// ramp exists in this design system - "neutral gray is the baseline"), so a
// multi-series chart needs two more hues beyond the four status colors;
// violet/teal are Tailwind's own default primitives, picked at the same
// 600 (light) / 500 (dark) weight the status colors already use.
export const CHART_PALETTE: Record<'light' | 'dark', ChartPalette> = {
  light: {
    primary: '#155dfc', // blue-600
    secondary: '#7f22fe', // violet-600
    tertiary: '#009689', // teal-600
    danger: '#e7000b', // red-600
    success: '#00a63e', // green-600
    warning: '#e17100', // amber-600
    grid: '#e5e7eb', // gray-200
    text: '#6a7282', // gray-500
  },
  dark: {
    primary: '#2b7fff', // blue-500
    secondary: '#8e51ff', // violet-500
    tertiary: '#00bba7', // teal-500
    danger: '#fb2c36', // red-500
    success: '#00c950', // green-500
    warning: '#fe9a00', // amber-500
    grid: '#1e2939', // gray-800
    text: '#99a1af', // gray-400
  },
}
