# SmartSense Marketplace — Implementation Tasks

---

## Phase 1 — Foundation

- [x] Scaffold React + TypeScript + Vite project
- [x] Configure Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first)
- [x] Configure React Router v7 (`react-router`)
- [x] Configure Apollo Client 3
- [x] Configure GraphQL Code Generator (`client-preset`)
- [x] Configure ESLint v9 flat config (strict TypeScript rules, no `any`)
- [x] Configure Prettier with `prettier-plugin-tailwindcss`
- [x] Configure Husky v9 (`pre-commit`, `commit-msg` hooks)
- [x] Configure lint-staged
- [x] Configure Commitlint (Conventional Commits)
- [x] Configure EditorConfig
- [x] Enable TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`)
- [x] Configure path aliases (`@/`, `@app/`, `@features/`, `@shared/`, `@lib/`, `@assets/`)
- [x] Configure environment variable handling (`appConfig` in `shared/config`)
- [x] Create `.env.example`
- [x] Create complete folder structure (`app/`, `features/`, `shared/`, `lib/`, `styles/`, `types/`)
- [x] Create placeholder `index.ts` files in all directories
- [x] Configure npm scripts (`dev`, `build`, `preview`, `lint`, `lint:fix`, `typecheck`, `format`)
- [x] Configure VS Code settings and extension recommendations
- [x] Configure GitHub Actions CI (lint → typecheck → build)
- [x] Configure Playwright (base config, `e2e/` directory)
- [x] Write README

---

## Phase 2 — Routing

- [x] Define route constants in `shared/constants`
- [x] Create public layout component
- [x] Create private layout component
- [x] Configure public routes (`/login`, `/unauthorized`, `/forbidden`, `/404`)
- [x] Configure private routes (`/dashboard`, `/catalog`, `/orders`, `/billing`)
- [x] Implement lazy loading for all route-level pages
- [x] Implement route guard skeleton (`app/guards/`) — `PublicGuard`, `PrivateGuard`, `RoleGuard`
- [x] Add 404 not-found fallback route
- [x] Separate route configuration from router setup (`app/router/routes.tsx`)
- [x] Create navigation configuration (`app/config/navigation.ts`)
- [x] Create breadcrumb configuration (`app/config/breadcrumbs.ts`)
- [x] Create placeholder pages for all features (Dashboard, Catalog, Orders, Billing)

---

## Phase 3 — Authentication

- [ ] Install and configure `keycloak-js`
- [ ] Create `AuthProvider` in `features/auth/`
- [ ] Implement login flow
- [ ] Implement logout flow
- [ ] Implement silent login / token refresh
- [ ] Implement session timeout handling
- [ ] Create `AuthService` (wraps Keycloak — app never imports `keycloak-js` directly)
- [ ] Create `useAuth` hook
- [ ] Implement `ProtectedRoute` guard
- [ ] Implement `PublicRoute` guard
- [ ] Create Unauthorized page
- [ ] Create Forbidden page
- [ ] Add role resolution utilities
- [ ] Write Playwright auth smoke tests

---

## Phase 4 — Apollo Client

- [ ] Connect Apollo Client to real GraphQL endpoint
- [ ] Configure authentication headers (attach Keycloak token)
- [ ] Configure token refresh on 401
- [ ] Configure error link (GraphQL + network errors)
- [ ] Configure retry link
- [ ] Configure cache policies per operation type
- [ ] Test Apollo Client connection

---

## Phase 5 — GraphQL

- [ ] Add GraphQL schema URL to codegen config
- [ ] Run `npm run codegen` and verify type generation
- [ ] Define shared fragments (`shared/graphql/`)
- [ ] Configure pagination fragment
- [ ] Validate generated hook imports work end-to-end

---

## Phase 6 — Shared Components

- [ ] Button component
- [ ] Input component
- [ ] Select component
- [ ] Textarea component
- [ ] Modal component
- [ ] Table component
- [ ] Pagination component
- [ ] Card component
- [ ] Badge component
- [ ] Skeleton loader component
- [ ] Spinner component
- [ ] Toast / notification component
- [ ] Empty state component
- [ ] Error state component
- [ ] Breadcrumb component
- [x] App shell layout (sidebar + header + content)
- [x] Sidebar navigation component
- [x] Header component

---

## Phase 7 — Dashboard

- [ ] Dashboard page (`/dashboard`)
- [ ] Statistics cards component
- [ ] Recent activity feed component
- [ ] Analytics charts placeholder
- [ ] Dashboard GraphQL queries
- [ ] `useDashboard` hook
- [ ] Skeleton loading state
- [ ] Empty state

---

## Phase 8 — Catalog

- [ ] Product list page (`/catalog`)
- [ ] Product detail page (`/catalog/:id`)
- [ ] Product create / edit page
- [ ] Category selector component
- [ ] Inventory status component
- [ ] Search + filter bar component
- [ ] Catalog GraphQL queries and mutations
- [ ] `useCatalog` hook
- [ ] `useProduct` hook
- [ ] Form schema (React Hook Form + Zod)
- [ ] Skeleton loading state
- [ ] Empty state

---

## Phase 9 — Orders

- [ ] Order list page (`/orders`)
- [ ] Order detail page (`/orders/:id`)
- [ ] Order timeline component
- [ ] Order status badge component
- [ ] Orders GraphQL queries and mutations
- [ ] `useOrders` hook
- [ ] `useOrder` hook
- [ ] Status update flow
- [ ] Skeleton loading state
- [ ] Empty state

---

## Phase 10 — Billing

- [ ] Invoice list page (`/billing`)
- [ ] Invoice detail page (`/billing/:id`)
- [ ] Invoice summary component
- [ ] Payment status component
- [ ] CSV / PDF download action
- [ ] Billing GraphQL queries and mutations
- [ ] `useBilling` hook
- [ ] Skeleton loading state
- [ ] Empty state

---

## Phase 11 — Testing

- [ ] Playwright smoke test — app loads without errors
- [ ] Playwright authentication test — login flow
- [ ] Playwright authentication test — logout flow
- [ ] Playwright authentication test — protected route redirect
- [ ] Playwright dashboard test — renders with data
- [ ] Playwright catalog test — product list renders
- [ ] Playwright catalog test — create product
- [ ] Playwright orders test — order list renders
- [ ] Playwright billing test — invoice list renders
- [ ] Configure Playwright in CI

---

## Phase 12 — Production

- [ ] Configure production environment variables
- [ ] Verify bundle size and code splitting
- [ ] Audit accessibility (WCAG 2.1 AA)
- [ ] Audit security (no secrets in bundle, CSP headers)
- [ ] Configure production build optimizations
- [ ] Add `test` job to GitHub Actions CI
- [ ] Write deployment runbook
- [ ] Tag v1.0.0 release
