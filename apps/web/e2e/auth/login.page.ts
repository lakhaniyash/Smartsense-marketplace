import type { Page } from '@playwright/test'

// Page Object Model per docs/testing.md § End-to-End Testing. This wraps
// Keycloak's own hosted login form (default theme) — the SPA never renders
// a credential form itself (docs/authentication.md § Frontend Auth Feature
// Responsibilities).
export class KeycloakLoginPage {
  constructor(private readonly page: Page) {}

  async loginAs(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Username or email').fill(email)
    await this.page.getByLabel('Password', { exact: true }).fill(password)
    await this.page.getByRole('button', { name: 'Sign In' }).click()
  }
}
