import webConfig from '@smartsense/eslint-config/web'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/lib/graphql/__generated__/**',
      'playwright-report/**',
      'test-results/**',
      'storybook-static/**',
      'coverage/**',
    ],
  },
  ...webConfig,
  {
    files: ['*.config.{js,ts}', 'codegen.ts', 'playwright.config.ts', '.storybook/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
