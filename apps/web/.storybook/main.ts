import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(dirname, '../src'),
          '@app': path.resolve(dirname, '../src/app'),
          '@features': path.resolve(dirname, '../src/features'),
          '@shared': path.resolve(dirname, '../src/shared'),
          '@lib': path.resolve(dirname, '../src/lib'),
          '@assets': path.resolve(dirname, '../src/assets'),
        },
      },
    }),
}

export default config
