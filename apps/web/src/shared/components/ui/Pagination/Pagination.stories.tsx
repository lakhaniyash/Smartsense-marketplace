import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination } from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  args: { onPrevious: () => {}, onNext: () => {} },
}

export default meta
type Story = StoryObj<typeof Pagination>

export const Middle: Story = { args: { hasPreviousPage: true, hasNextPage: true } }
export const FirstPage: Story = { args: { hasPreviousPage: false, hasNextPage: true } }
export const LastPage: Story = { args: { hasPreviousPage: true, hasNextPage: false } }
