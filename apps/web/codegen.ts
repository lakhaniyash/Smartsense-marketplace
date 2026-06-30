import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env['VITE_GRAPHQL_URL'] ?? 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.gql'],
  generates: {
    'src/lib/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
