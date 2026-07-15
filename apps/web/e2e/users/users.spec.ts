import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only users (docs/keycloak-setup.md § Users). Sprint 3 (User
// Management, Jira Epic SM-331) — not tied to a docs/milestones.md milestone.
//
// The entire User Management surface is Admin-gated (users:read / users:manage
// are granted only to the Admin role in database/prisma/seed.ts), so every
// positive flow shares ONE Admin login, folded into a single comprehensive
// test() rather than several — the same discipline customers.spec.ts documents
// for this realm's `bruteForceProtected: true` setting. The negative-access
// test logs in as a different account (Customer) and carries no such risk.
//
// Coverage note on suspend/reactivate (SM-342 req #1): the Suspend/Reactivate
// *mutations* are deliberately NOT driven against a real account here. Every
// ACTIVE user in the seed is a shared Keycloak login that other spec files
// depend on (suspending one blocks its login and would flake those suites),
// and a freshly-invited user is INVITED, not ACTIVE, so its Status tab shows
// the invited notice rather than a Suspend button. Instead this test asserts
// the Status tab renders correctly and that the self-suspend guardrail is
// enforced (disabled-with-reason). The status transition itself is covered by
// backend unit + integration tests (SM-335) and the identical confirm-dialog
// UI is already exercised by customers.spec.ts.
//
// Guardrail #2 (last-Admin-standing, SM-342 req #3) is likewise not
// UI-reachable in this single-Admin seed: it can only be hit by removing the
// Admin role from the last Admin, but guardrail #1 disables editing one's own
// roles, and there is no second Admin to attempt it as. It is covered by
// backend unit tests (SM-334).
const ADMIN_EMAIL = 'yash.lakhani+admin@smartsensesolutions.com'
const ADMIN_PASSWORD = 'Admin@12345'
const CUSTOMER_EMAIL = 'yash.lakhani+customer@smartsensesolutions.com'
const CUSTOMER_PASSWORD = 'Customer@12345'

test.describe('User Management', () => {
  test('an Admin invites a user, manages their roles, views their tabs, and the escalation guardrails hold', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const fullName = `Playwright E2E User ${timestamp}`
    const email = `yash.lakhani+pwe2e${timestamp}@smartsensesolutions.com`
    const roleName = `Playwright Role ${timestamp}`

    // --- Invite (ownerType NONE = platform staff, so no org UUID needed) ---
    await page.goto('/users/invite')
    await new KeycloakLoginPage(page).loginAs(ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page).toHaveURL(/\/users\/invite$/)

    await page.getByLabel('Full name').fill(fullName)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Account type').selectOption({ label: 'Platform staff' })
    await page.getByRole('checkbox', { name: 'Partner' }).check()
    await page.getByRole('button', { name: 'Send invite' }).click()

    await expect(page.getByText('Invitation sent').first()).toBeVisible()
    // Redirect to the new user's detail page.
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: fullName })).toBeVisible()

    // --- Profile tab (default) is view-only and shows the email ---
    await expect(page.getByText(email).first()).toBeVisible()

    // --- Roles & Permissions tab: Partner already assigned; assign then
    // remove the Customer role (available-role rows use `rounded-md border`,
    // distinct from the assigned-role Cards' `rounded-lg`). ---
    await page.getByRole('tab', { name: 'Roles & Permissions' }).click()
    await expect(page.getByText('Partner').first()).toBeVisible()

    const customerAvailableRow = page
      .locator('div.rounded-md.border')
      .filter({ hasText: 'Customer' })
    await customerAvailableRow.getByRole('button', { name: 'Assign' }).click()
    await expect(page.getByText('Role assigned').first()).toBeVisible()

    // Now assigned — remove it again (net-zero for this throwaway user).
    await page.getByRole('button', { name: 'Remove' }).last().click()
    await expect(page.getByText('Role removed').first()).toBeVisible()

    // --- Status tab renders the INVITED notice (no Suspend button yet) ---
    await page.getByRole('tab', { name: 'Status' }).click()
    await expect(page.getByText(/invited/i).first()).toBeVisible()

    // --- Activity tab reflects the invite + role changes, most recent first ---
    await page.getByRole('tab', { name: 'Activity' }).click()
    const activity = page.getByRole('tabpanel', { name: 'Activity' }).getByRole('listitem')
    await expect(activity.filter({ hasText: 'User invited' })).toBeVisible()
    await expect(activity.filter({ hasText: 'Role assigned' })).toBeVisible()
    await expect(activity.filter({ hasText: 'Role removed' })).toBeVisible()

    // --- Guardrail #1 (no self-edit): open the Admin's OWN detail page and
    // assert the self-mutating controls are disabled-with-reason, not hidden. ---
    await page.goto('/users')
    await page.getByLabel('Search', { exact: true }).fill('Platform Admin')
    const ownRow = page.getByRole('row', { name: /Platform Admin/ })
    await ownRow.getByRole('link', { name: 'Platform Admin' }).click()
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/)

    await page.getByRole('tab', { name: 'Status' }).click()
    await expect(page.getByRole('button', { name: 'Suspend user' })).toBeDisabled()

    await page.getByRole('tab', { name: 'Roles & Permissions' }).click()
    // The caller's own Admin-role Remove button is disabled (self-edit guard).
    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeDisabled()

    // --- Roles admin page: system roles are locked; create + archive a
    // custom role. ---
    await page.goto('/users/roles')
    const adminRoleRow = page.getByRole('row', { name: /Admin.*System/ })
    await expect(adminRoleRow.getByRole('button', { name: 'Edit' })).toBeDisabled()
    await expect(adminRoleRow.getByRole('button', { name: 'Archive' })).toBeDisabled()

    await page.getByRole('button', { name: 'Create role' }).click()
    const drawer = page.getByRole('dialog')
    await drawer.getByLabel('Name').fill(roleName)
    await drawer.getByRole('checkbox', { name: 'users:read' }).check()
    await drawer.getByRole('button', { name: 'Create role' }).click()
    await expect(page.getByText('Role created').first()).toBeVisible()

    const newRoleRow = page.getByRole('row', { name: new RegExp(roleName) })
    await expect(newRoleRow).toBeVisible()
    await newRoleRow.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
    await expect(page.getByText('Role archived').first()).toBeVisible()
  })

  // A different account — never run concurrently against the same seeded user
  // as the test above (bruteForceProtected realm only makes concurrent logins
  // as the *same* user flaky).
  test('a Customer-role login has no Users nav item and cannot reach /users', async ({ page }) => {
    await page.goto('/dashboard')
    await new KeycloakLoginPage(page).loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()

    // users:read / users:manage are Admin-only (docs/authorization.md
    // § Resource Authorization) — User Management is not buyer self-service.
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible()

    await page.goto('/users')
    await expect(page).toHaveURL(/\/forbidden$/)
    await expect(
      page.getByRole('heading', { name: "You don't have access to this page" }),
    ).toBeVisible()
  })
})
