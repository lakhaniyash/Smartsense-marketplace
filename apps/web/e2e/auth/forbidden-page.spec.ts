import { test, expect } from '@playwright/test'

test.describe('Forbidden page', () => {
  test('renders with a link back to the dashboard', async ({ page }) => {
    await page.goto('/forbidden')

    await expect(
      page.getByRole('heading', { name: "You don't have access to this page" }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })
})
