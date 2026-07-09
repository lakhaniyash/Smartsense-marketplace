import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { ThemeProvider } from '@shared/components'
import { AppLayout } from './AppLayout'
import { Content } from './Content'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const meta: Meta<typeof AppLayout> = {
  title: 'Layouts/AppLayout',
  component: AppLayout,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AppLayout>

export const Default: Story = {
  render: () => (
    <AppLayout
      header={<Header title="SmartSense Marketplace" subtitle="Admin Console" />}
      sidebar={
        <Sidebar
          items={[{ label: 'Dashboard', href: '/dashboard' }]}
          userLabel="yash.lakhani@smartsensesolutions.com"
          userInitials="YL"
          roleLabel="Admin Console"
          onLogout={() => {}}
        />
      }
    >
      <Content>Page content goes here.</Content>
    </AppLayout>
  ),
}
