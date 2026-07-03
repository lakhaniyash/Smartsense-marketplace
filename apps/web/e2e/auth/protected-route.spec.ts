import { test, expect } from '@playwright/test'

test.describe('Protected route redirect', () => {
  test('sends an unauthenticated user to Keycloak sign-in', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/realms\/smartsense-marketplace\/protocol\/openid-connect\/auth/)
  })

  test('unauthenticated access to /catalog also redirects to sign-in', async ({ page }) => {
    await page.goto('/catalog')

    await expect(page).toHaveURL(/\/realms\/smartsense-marketplace\/protocol\/openid-connect\/auth/)
  })
})
