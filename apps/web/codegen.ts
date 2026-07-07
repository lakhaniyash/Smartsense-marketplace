import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env['VITE_GRAPHQL_URL'] ?? 'http://localhost:3000/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.gql'],
  generates: {
    'src/lib/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      config: {
        // Matches the backend's DecimalScalar (apps/api/src/common/graphql/decimal.scalar.ts),
        // which serializes/parses as a string end-to-end — without this, an
        // unmapped custom scalar defaults to `any` (banned, docs/coding-standards.md § 3).
        scalars: { Decimal: 'string' },
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
