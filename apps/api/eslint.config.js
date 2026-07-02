// @ts-check
const apiConfig = require('@smartsense/eslint-config/api')

module.exports = [
  ...apiConfig,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Enables type-aware linting so `consistent-type-imports` can see
        // `emitDecoratorMetadata` usage and avoid stripping constructor
        // parameter types NestJS needs as real imports for DI — without
        // this, the rule's autofix silently breaks dependency injection
        // (design:paramtypes degrades to `Function`).
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
]
