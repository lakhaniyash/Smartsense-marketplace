import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExportMenu } from './ExportMenu'

const meta: Meta<typeof ExportMenu> = {
  title: 'UI/ExportMenu',
  component: ExportMenu,
  args: {
    // Storybook demo only - the real callback lives in the consuming
    // feature (this component has no export mechanics of its own).
    onExport: () => {},
  },
}

export default meta
type Story = StoryObj<typeof ExportMenu>

export const Default: Story = {}

export const Exporting: Story = {
  args: { isExporting: true },
}

export const AllFormatsEnabled: Story = {
  args: { disabledFormats: [] },
  parameters: {
    docs: {
      description: {
        story:
          'Once a real Excel export lands, flipping it on is a one-line `disabledFormats` change.',
      },
    },
  },
}
