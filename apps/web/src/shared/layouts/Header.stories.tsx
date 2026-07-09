import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeProvider } from '@shared/components'
import { Header } from './Header'

const meta: Meta<typeof Header> = {
  title: 'Layouts/Header',
  component: Header,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  args: {
    title: 'SmartSense Marketplace',
    subtitle: 'Admin Console',
    onOpenSearch: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {}
