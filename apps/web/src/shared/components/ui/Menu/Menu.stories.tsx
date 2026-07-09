import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'

const meta: Meta<typeof Menu> = {
  title: 'UI/Menu',
  component: Menu,
}

export default meta
type Story = StoryObj<typeof Menu>

export const Default: Story = {
  render: () => (
    <Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuLabel>Order actions</MenuLabel>
      <MenuSeparator />
      <MenuItem>Duplicate</MenuItem>
      <MenuItem>Export</MenuItem>
      <MenuSeparator />
      <MenuItem variant="danger">Delete</MenuItem>
    </Menu>
  ),
}
