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

- [ ] Define route constants in `shared/constants`
- [ ] Create public layout component
- [ ] Create private layout component
- [ ] Configure public routes (`/login`, `/unauthorized`, `/forbidden`, `/404`)
- [ ] Configure private routes (`/dashboard`, `/catalog`, `/orders`, `/billing`)
- [ ] Implement lazy loading for all route-level pages
- [ ] Implement route guard skeleton (`app/guards/`)
- [ ] Add 404 not-found fallback route

---

## Phase 3 — Authentication

- [x] Install and configure `keycloak-js`
- [x] Create `AuthProvider` in `features/auth/`
- [x] Implement login flow
- [x] Implement logout flow
- [x] Implement silent login / token refresh
- [x] Implement session timeout handling
- [x] Create `AuthService` (wraps Keycloak — app never imports `keycloak-js` directly)
- [x] Create `useAuth` hook
- [x] Implement `ProtectedRoute` guard
- [x] Implement `PublicRoute` guard
- [x] Create Unauthorized page
- [x] Create Forbidden page
- [x] Add role resolution utilities
- [x] Write Playwright auth smoke tests

---

## Phase 4 — Apollo Client

- [x] Connect Apollo Client to real GraphQL endpoint
- [x] Configure authentication headers (attach Keycloak token)
- [x] Configure token refresh on 401
- [x] Configure error link (GraphQL + network errors)
- [ ] Configure retry link
- [x] Configure cache policies per operation type
- [x] Test Apollo Client connection

---

## Phase 5 — GraphQL

- [x] Add GraphQL schema URL to codegen config
- [x] Run `npm run codegen` and verify type generation
- [ ] Define shared fragments (`shared/graphql/`)
- [ ] Configure pagination fragment
- [x] Validate generated hook imports work end-to-end

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
- [ ] App shell layout (sidebar + header + content)
- [ ] Sidebar navigation component
- [ ] Header component

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

---

## Milestone 4 — Backend Foundation

- [x] Initialize NestJS 11 project in `apps/backend/`
- [x] Configure strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `emitDecoratorMetadata`)
- [x] Configure ESLint v9 flat config (`eslint.config.js`) with `typescript-eslint/recommended`
- [x] Configure Prettier (`.prettierrc`)
- [x] Configure lint-staged in `apps/backend/package.json`
- [x] Integrate backend lint-staged into root Husky pre-commit hook
- [x] Configure GraphQL code-first (`@nestjs/graphql` + `@nestjs/apollo` + Apollo Server 4)
- [x] Configure Prisma with PostgreSQL (`prisma/schema.prisma` — no models yet)
- [x] Configure environment management (`@nestjs/config` + Joi validation schema)
- [x] Create `GlobalExceptionFilter` — handles HTTP and GraphQL errors uniformly
- [x] Create `LoggingService` — injectable logger wrapping NestJS built-in `Logger`
- [x] Create `AppValidationPipe` — configured `class-validator` + `class-transformer`
- [x] Create `CommonModule` (global) — exports `LoggingService`
- [x] Create `PrismaModule` (global) — exports `PrismaService` with connect/disconnect lifecycle
- [x] Create `HealthModule` — `GET /health` via `@nestjs/terminus`
- [x] Create `AuthModule` — boilerplate (resolver + service, no business logic)
- [x] Create `UsersModule` — boilerplate (resolver + service, no business logic)
- [x] Create `CatalogModule` — boilerplate (resolver + service, no business logic)
- [x] Create `OrdersModule` — boilerplate (resolver + service, no business logic)
- [x] Create `BillingModule` — boilerplate (resolver + service, no business logic)
- [x] Configure Docker — multi-stage `Dockerfile` + `docker-compose.yml` (API + PostgreSQL)
- [x] Write `apps/backend/README.md`

---

## Milestone 5 — Turborepo Monorepo

- [x] Convert repo to Turborepo monorepo with npm workspaces
- [x] Move React frontend from root to `apps/web/`
- [x] Rename `apps/backend/` to `apps/api/`
- [x] Configure `turbo.json` task pipeline (build, dev, lint, typecheck, test, test:e2e)
- [x] Create `packages/tsconfig/` — `base.json`, `react-app.json`, `node.json`
- [x] Create `packages/eslint-config/` — `web.js` (ESM) + `api.cjs` (CJS)
- [x] Update `apps/web/tsconfig.app.json` and `tsconfig.node.json` to extend shared configs
- [x] Update `apps/api/tsconfig.json` to extend `@smartsense/tsconfig/node`
- [x] Update `apps/web/eslint.config.js` to use `@smartsense/eslint-config/web`
- [x] Update `apps/api/eslint.config.js` to use `@smartsense/eslint-config/api`
- [x] Scaffold `packages/ui/` — shared React component library
- [x] Scaffold `packages/shared-types/` — shared TypeScript interfaces
- [x] Scaffold `packages/graphql/` — shared GraphQL schema and fragments
- [x] Scaffold `packages/config/` — shared runtime config utilities
- [x] Create `database/prisma/schema.prisma` (centralized schema)
- [x] Configure `apps/api/package.json` prisma schema path to `database/prisma/schema.prisma`
- [x] Create `infrastructure/docker/docker-compose.yml` (full-stack compose)
- [x] Update root `.husky/pre-commit` — runs lint-staged per workspace
- [x] Update root `.gitignore` for monorepo paths and `.turbo/`
- [x] Update root `.prettierignore` for monorepo paths
- [x] Update `.github/workflows/ci.yml` to use `turbo run` commands
- [x] Update root `README.md` with monorepo documentation

---

## Milestone 6 — Database Design

- [x] Read `docs/domain-model.md`
- [x] Create Entity-Relationship Diagram (Mermaid) — `docs/database-schema.md`
- [x] Design a normalized PostgreSQL schema
- [x] Create `database/prisma/schema.prisma`
- [x] Configure UUID primary keys
- [x] Configure `createdAt` / `updatedAt`
- [x] Configure soft delete strategy
- [x] Configure indexes
- [x] Configure foreign keys (with explicit `onDelete`/`onUpdate`)
- [x] Configure unique constraints
- [x] Explain every relationship — `docs/database-schema.md`
- [x] Validate the schema (`prisma format` + `prisma validate`)
- [x] Create seed data script — `database/prisma/seed.ts` (Roles, Permissions, Admin User, Sample Partner, Categories)
- [x] Wire up `prisma db seed` in `apps/api/package.json`
- [x] Update documentation — `docs/database-schema.md`, this file
- [x] Generate initial Prisma migration (`prisma migrate dev --create-only`) — `database/prisma/migrations/20260701110512_init/migration.sql`, **not applied**
- [x] Hand-add raw-SQL `CHECK`/exclusion constraints documented in `docs/database-schema.md` to the generated migration
- [x] Verify hand-written constraints against a scratch database (all 5 correctly reject invalid data; valid rows still succeed)
- [ ] **Approval checkpoint** — apply migration to local PostgreSQL 17 — **on hold pending review**
- [ ] Run seed script
