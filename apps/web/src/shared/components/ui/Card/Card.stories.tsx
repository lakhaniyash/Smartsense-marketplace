import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Order #1234</CardTitle>
        <CardDescription>Placed 2 days ago</CardDescription>
      </CardHeader>
      <CardContent>3 items, shipped to Ahmedabad</CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">
          View
        </Button>
      </CardFooter>
    </Card>
  ),
}
