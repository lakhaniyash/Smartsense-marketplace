# SmartSense Marketplace — Repository & Folder Structure

Version: 1.0

Applies to: the `smartsense-marketplace` Turborepo monorepo (npm workspaces).

---

## Purpose

This document explains **how the repository is organized and why**. It is the single source of truth for:

- Where a new file belongs.
- Which folders may import from which other folders.
- What naming convention a new file, folder, or module must follow.

It does **not** repeat information owned by other documents. Where a topic is covered in depth elsewhere, this document links to it instead of duplicating it:

| Topic                                         | Owning document                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Architectural principles, layering, data flow | [architecture.md](./architecture.md)                                   |
| Product requirements, modules, roles          | [requirements.md](./requirements.md)                                   |
| Authentication & authorization flows          | [authentication.md](./authentication.md)                               |
| Keycloak realm, clients, Docker topology      | [keycloak-setup.md](./keycloak-setup.md)                               |
| Domain entities and business rules            | [domain-model.md](./domain-model.md)                                   |
| Prisma schema, migrations, indexing           | [database-schema.md](./database-schema.md)                             |
| GraphQL schema and client conventions         | [graphql.md](./graphql.md), [api-conventions.md](./api-conventions.md) |
| Coding standards and review checklist         | [coding-standards.md](./coding-standards.md)                           |
| UI design system                              | [ui-guidelines.md](./ui-guidelines.md)                                 |
| Testing strategy                              | [testing.md](./testing.md)                                             |
| CI/CD and deployment                          | [deployment.md](./deployment.md)                                       |

---

## Why This Structure Exists

The repository is a **Turborepo monorepo** with two independently deployable applications (`apps/web`, `apps/api`) and a set of shared packages consumed by both. This split exists for three reasons:

1. **Independent deployability.** The frontend (Vite/React, static) and backend (NestJS, long-running process) have different build outputs, runtime environments, and release cadences. Keeping them as separate workspaces lets them build, version, and deploy independently while still sharing one Git history and one CI pipeline.
2. **Single source of truth for cross-cutting concerns.** TypeScript configs, ESLint rules, and (eventually) shared types/GraphQL fragments/UI primitives live once in `packages/` instead of being copy-pasted into each app. A rule changed in `packages/eslint-config` applies everywhere immediately.
3. **Database ownership independent of any one app.** `database/prisma` sits outside `apps/api` because the schema is the contract between the database and any current or future consumer (the API today, a worker or CLI tool tomorrow) — it must not be perceived as private to one app.

Within `apps/web`, the **feature-based architecture** (see [architecture.md](./architecture.md#architecture-principles)) exists so that:

- A feature (`catalog`, `orders`, `billing`, `dashboard`, `auth`) can be understood, tested, and modified by reading one folder, without tracing logic scattered across type-based layers (`components/`, `hooks/`, `services/` at the top level).
- Multiple engineers can work on different features in parallel with minimal merge conflicts, because features do not import from one another.
- A feature can be deleted or extracted wholesale (e.g. into a separate micro-frontend) by deleting one folder.

Within `apps/api`, the **module-per-domain** structure (NestJS's native pattern) mirrors the same idea on the backend: `modules/catalog`, `modules/orders`, `modules/billing`, `modules/users`, `modules/auth` each own their resolver, service, and module definition.

---

## Root Layout

```
smartsense-marketplace/
├── apps/                   # Deployable applications
│   ├── web/                # React SPA (Vite, Apollo Client, Tailwind CSS)
│   └── api/                # NestJS GraphQL API (Apollo Server, Prisma)
├── packages/                # Shared, versionless workspace packages
│   ├── ui/                  # Shared React component library
│   ├── shared-types/        # Shared TypeScript types/interfaces
│   ├── graphql/             # Shared GraphQL schema/fragments
│   ├── config/               # Shared runtime configuration utilities
│   ├── eslint-config/        # Shared ESLint flat configs (web + api)
│   └── tsconfig/             # Shared TypeScript base configs
├── database/
│   └── prisma/               # Prisma schema, migrations, seed script
├── infrastructure/
│   ├── docker/                # Full-stack docker-compose
│   └── keycloak/              # Keycloak realm export
├── docs/                      # This documentation set
├── .github/
│   └── workflows/             # CI pipeline (GitHub Actions)
├── .claude/
│   └── agents/                 # Claude Code subagent definitions for this repo
├── turbo.json                  # Turborepo task graph
├── package.json                 # Workspace root — npm workspaces, root scripts
├── commitlint.config.js          # Conventional Commits + Jira key enforcement
└── CLAUDE.md                      # Non-negotiable project rules for AI-assisted changes
```

### Root folder responsibilities

| Folder               | Responsibility                                                                                | Never contains                                   |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `apps/`              | Runnable applications with their own `package.json`, build, and deploy target                 | Shared/reusable code meant for more than one app |
| `packages/`          | Code shared by two or more workspaces, published only within the monorepo                     | App-specific business logic or routing           |
| `database/`          | The Prisma schema — the single source of truth for the data model, independent of any one app | Application code, resolvers, services            |
| `infrastructure/`    | Local/deployment infrastructure definitions (Docker Compose, Keycloak realm)                  | Application source code                          |
| `docs/`              | Markdown documentation only                                                                   | Code, scripts                                    |
| `.github/workflows/` | CI pipeline definitions                                                                       | Deployment secrets, application logic            |
| `.claude/`           | Claude Code configuration (subagents, local settings) for this repo                           | Anything required at runtime or build time       |

Turborepo's task graph (`turbo.json`) enforces the dependency direction implied by this layout: `build` and `typecheck` depend on `^build` / `^typecheck` (upstream packages first), so `packages/*` always builds before the `apps/*` that consume it.

---

## `apps/web` — Frontend Application

```
apps/web/
├── e2e/                       # Playwright end-to-end tests (see testing.md)
├── src/
│   ├── app/                    # Application shell — see below
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── guards/
│   │   ├── layouts/
│   │   ├── providers/
│   │   └── router/
│   ├── assets/                  # Static assets (images, fonts, svgs)
│   ├── features/                 # Feature modules — see below
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── catalog/
│   │   ├── dashboard/
│   │   └── orders/
│   ├── lib/                       # Third-party client wiring
│   │   ├── apollo/                 # Apollo Client instance and links
│   │   └── graphql/__generated__/   # GraphQL Code Generator output — never edit
│   ├── shared/                       # Cross-feature reusable code — see below
│   │   ├── components/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── graphql/
│   │   ├── hooks/
│   │   ├── icons/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── styles/                        # Reserved for global styles (Tailwind entry lives at src/index.css)
│   ├── types/                          # Global ambient/module-level types
│   ├── App.tsx                          # Composes Providers + AppRouter
│   ├── main.tsx                          # React root mount
│   └── vite-env.d.ts
├── codegen.ts                             # GraphQL Code Generator config
├── playwright.config.ts                    # Playwright config
├── vite.config.ts                           # Vite config + path aliases
└── tsconfig*.json                            # Project references + path aliases
```

### `app/` — Application Shell

Everything required to bootstrap the app once, before any feature renders. Per [architecture.md](./architecture.md#app), this is: providers, routing, layout selection, route guards, and global configuration.

| Folder       | Belongs here                                                                                                                       | Never place here                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `bootstrap/` | One-time startup logic (e.g. initializing Keycloak, feature flags)                                                                 | Business logic, UI components                                          |
| `config/`    | Centralized access to `import.meta.env` — the _only_ place env vars are read                                                       | Direct `import.meta.env.X` reads elsewhere                             |
| `constants/` | App-wide constants that are not feature-specific (route paths, storage keys)                                                       | Feature-specific constants                                             |
| `guards/`    | Route guard components (`<RequireAuth>`, `<RequireRole>`) used by the router                                                       | Business/authorization logic itself — guards call into `features/auth` |
| `layouts/`   | Layout shells referenced by the router (Public, Partner, Admin, Customer layouts per [architecture.md](./architecture.md#routing)) | Page content — layouts only arrange `<Outlet />` and shared chrome     |
| `providers/` | Composition of app-wide React context providers (Apollo, theme, etc.)                                                              | Feature-specific providers                                             |
| `router/`    | The route tree (`AppRouter`), built with lazy-loaded routes                                                                        | Route guard logic, layout markup                                       |

`App.tsx` wires these together (`<Providers><AppRouter /></Providers>`) and nothing else. It must stay a thin composition root.

### `features/` — Feature Modules

Each business capability from [requirements.md](./requirements.md#modules) owns one folder: `auth`, `dashboard`, `catalog`, `orders`, `billing`. Every feature folder has an identical internal shape:

```
features/<feature-name>/
├── components/     # Feature-specific presentational/container components
├── constants/       # Feature-specific constants
├── graphql/           # Feature's queries, mutations, fragments (.graphql documents)
├── hooks/               # Feature-specific hooks (data + UI logic)
├── pages/                 # Route-level components rendered by the router
├── services/                # Feature's API-calling layer (wraps generated Apollo hooks)
├── types/                     # Feature-specific types not covered by generated GraphQL types
├── utils/                       # Feature-specific pure helper functions
└── index.ts                       # Barrel — the feature's public surface
```

**Rules:**

- A feature must **never** import from another feature's internals (`features/orders` must not import `features/billing/hooks/useInvoice`). Cross-feature communication goes through `shared/` or through composition at the `app/` or page level.
- A feature's `index.ts` barrel is the only import path other layers may use: `import { LoginForm } from '@features/auth'`, never `@features/auth/components/LoginForm`.
- New product modules (`notifications`, `analytics`, `settings`, `reports` — see [architecture.md](./architecture.md#future-scalability)) follow this exact same internal shape.

### `lib/` — Third-Party Client Wiring

Configuration and instantiation of external client libraries that are used app-wide, as opposed to `shared/services` (first-party wrappers around them).

| Folder                   | Belongs here                                                       | Never place here                                                                        |
| ------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `apollo/`                | Apollo Client instance, links (auth, error, http), cache config    | GraphQL documents (those live in `features/*/graphql` or `shared/graphql`)              |
| `graphql/__generated__/` | Output of `npm run codegen` (GraphQL Code Generator client preset) | Anything hand-written — this directory is regenerated and must never be edited manually |

### `shared/` — Cross-Feature Reusable Code

Anything used by **two or more** features, or that has no feature affinity at all.

| Folder        | Examples                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `components/` | `Button`, `Modal`, `Table`, `Toast`, `Pagination`, `Card`, `Badge`        |
| `config/`     | Shared, non-secret runtime configuration helpers                          |
| `constants/`  | Constants with no feature ownership (e.g. pagination page sizes)          |
| `graphql/`    | Shared fragments used across features                                     |
| `hooks/`      | `useDebounce`, `useMediaQuery`, `usePagination`                           |
| `icons/`      | Icon components                                                           |
| `layouts/`    | Reusable layout primitives consumed by `app/layouts`                      |
| `services/`   | Cross-cutting API/browser wrappers (e.g. a generic HTTP error normalizer) |
| `types/`      | Shared TypeScript types with no single feature owner                      |
| `utils/`      | Pure helpers: date formatting, string formatting, currency formatting     |

A component moves from a feature into `shared/` only once a second feature needs it — do not pre-emptively generalize.

### Import Rules (Frontend)

Enforced via the path aliases in `apps/web/tsconfig.app.json` and `vite.config.ts`:

| Alias         | Resolves to      |
| ------------- | ---------------- |
| `@/*`         | `src/*`          |
| `@app/*`      | `src/app/*`      |
| `@features/*` | `src/features/*` |
| `@shared/*`   | `src/shared/*`   |
| `@lib/*`      | `src/lib/*`      |
| `@assets/*`   | `src/assets/*`   |

Allowed dependency direction:

```
app  →  features  →  shared
```

- `shared/*` must never import from `features/*` or `app/*`.
- `features/*` must never import from `app/*`, and must never import another feature.
- **Sanctioned exception:** any feature may import `usePermissions`/`useCurrentUser` from
  `@features/auth`. Identity and permission state are the one cross-cutting concern every
  feature legitimately needs (`docs/authentication.md` § Permission Strategy already treats
  permission-checking as universal, not auth-specific), but promoting the two hooks to
  `shared/` isn't a clean move: `useCurrentUser` depends on `useAuth`, which depends on
  `AuthContext` — the Keycloak-backed provider that legitimately belongs to the auth feature
  (login/logout, token lifecycle). Promoting the hooks would mean promoting that whole chain,
  which would gut the feature rather than fix a boundary violation. No other cross-feature
  import is permitted under this exception — if a future need looks similar, promote the
  capability to `shared/` on its second real consumer (per `CLAUDE.md`), don't extend this list.
- Always import via absolute aliases (`@shared/components`), never deep relative paths that cross folder boundaries (`../../../shared/components`). Relative imports are acceptable only _within_ the same feature or folder.
- Always import via a barrel (`index.ts`) — never reach into another folder's internal file path.

### Naming Conventions (Frontend)

| Item              | Convention                                             | Example             |
| ----------------- | ------------------------------------------------------ | ------------------- |
| Component files   | `PascalCase.tsx`                                       | `ProductCard.tsx`   |
| Hook files        | `camelCase.ts`, prefixed `use`                         | `useDebounce.ts`    |
| Service files     | `camelCase.service.ts`                                 | `auth.service.ts`   |
| GraphQL documents | `camelCase.graphql`                                    | `getOrders.graphql` |
| Type-only files   | `camelCase.types.ts`                                   | `order.types.ts`    |
| Test files        | co-located `*.spec.ts` / Playwright specs under `e2e/` | `auth.spec.ts`      |
| Folders           | `kebab-case` or lowercase single word                  | `order-timeline/`   |
| Barrel files      | always `index.ts`                                      | —                   |

Every feature and shared subfolder exposes a barrel export (`index.ts`) re-exporting its public API. This is what allows the import rules above to be enforced — there is exactly one valid import path into any module.

---

## `apps/api` — Backend Application

```
apps/api/
├── src/
│   ├── common/                  # Cross-cutting NestJS providers
│   │   ├── filters/               # Exception filters
│   │   ├── pipes/                   # Validation pipes
│   │   └── services/                  # Global providers (e.g. LoggingService)
│   ├── config/                          # Environment configuration + validation schema
│   ├── health/                            # Health check endpoint (Terminus)
│   ├── modules/                             # Domain modules — see below
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── catalog/
│   │   ├── orders/
│   │   └── users/
│   ├── prisma/                                 # Prisma client provider/module
│   ├── app.module.ts                              # Root module composition
│   ├── main.ts                                     # Nest application bootstrap
│   └── schema.gql                                        # Auto-generated GraphQL SDL (code-first) — never edit
├── test/                                                    # Jest e2e config
└── tsconfig.json                                               # Path alias: @/* → src/*
```

### `modules/` — Domain Modules

Each folder under `modules/` is a self-contained NestJS module for one bounded context from [domain-model.md](./domain-model.md): `auth`, `users`, `catalog`, `orders`, `billing`. A module contains, at minimum:

```
modules/<name>/
├── <name>.module.ts       # NestJS module definition — imports, providers, exports
├── <name>.resolver.ts     # GraphQL resolver — query/mutation entry points
└── <name>.service.ts      # Business logic, Prisma access
```

Larger modules add subfolders as needed, following the pattern established by `modules/auth`:

| Subfolder     | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `decorators/` | Custom parameter/method decorators (`@CurrentUser()`, `@Permissions()`, `@Public()`) |
| `dto/`        | GraphQL input/output types (`class-validator`/`class-transformer` decorated)         |
| `guards/`     | `CanActivate` guards (`GqlAuthGuard`, `PermissionGuard`)                             |
| `strategies/` | Passport strategies (`JwtStrategy`)                                                  |
| `types/`      | Module-internal TypeScript types (e.g. `AuthContext`)                                |

Details of the auth module's JWT validation, guard chain, and RBAC design are documented in [authentication.md](./authentication.md#backend-auth-module-responsibilities) — this document only describes where the files live, not what they do.

**Rules:**

- A module's service is the only place that talks to Prisma for that module's entities. Resolvers must not call `PrismaService` directly.
- Cross-module calls go through the other module's exported service (import via the module's `exports` array), never by reaching into its internal files.
- `*.spec.ts` files are co-located next to the file under test (e.g. `jwt.strategy.ts` + `jwt.strategy.spec.ts`), not in a parallel `__tests__` tree.

### `common/`, `config/`, `health/`, `prisma/`

| Folder    | Belongs here                                                                                                                                   | Never place here                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `common/` | Providers used by more than one module, registered globally (`@Global()`), e.g. `LoggingService`, `GlobalExceptionFilter`, `AppValidationPipe` | Domain/business logic specific to one module   |
| `config/` | `configuration.ts` (typed config factory) and `validation.schema.ts` (Joi schema for env vars) — the only place `process.env` is read          | Reading `process.env` anywhere else in the app |
| `health/` | Liveness/readiness endpoint (`/health`) for container orchestration                                                                            | Business logic                                 |
| `prisma/` | `PrismaModule` / `PrismaService` — the single injectable Prisma client                                                                         | A second Prisma client instance                |

### Import Rules (Backend)

- `apps/api/src/*` uses the `@/*` alias mapping to `src/*` (see `apps/api/tsconfig.json`). Prefer it over deep relative paths (`../../../common/...`) once an import crosses more than one directory level.
- `modules/*` may depend on `common/`, `config/`, and `prisma/`, never the other way around.
- `modules/*` must not import from another module's non-exported files.
- The Prisma schema lives in `database/prisma/schema.prisma`, outside this app — `apps/api/package.json`'s `"prisma"` field points there. Do not add a second schema under `apps/api`.

### Naming Conventions (Backend)

| Item             | Convention                             | Example                      |
| ---------------- | -------------------------------------- | ---------------------------- |
| Module files     | `<name>.module.ts`                     | `catalog.module.ts`          |
| Resolver files   | `<name>.resolver.ts`                   | `orders.resolver.ts`         |
| Service files    | `<name>.service.ts`                    | `billing.service.ts`         |
| Guard files      | `<name>.guard.ts`                      | `roles.guard.ts`             |
| DTO/output files | `<name>.output.ts` / `<name>.input.ts` | `current-user.output.ts`     |
| Test files       | `<subject>.spec.ts`, co-located        | `permission.service.spec.ts` |
| Folders          | `kebab-case`                           | `strategies/`                |

---

## `packages/` — Shared Workspace Packages

Each package is an npm workspace, referenced by name (`@smartsense/<package>`), never by relative path across app boundaries.

| Package                  | Purpose                                                                               | Current state                                                        |
| ------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/tsconfig`      | Base `tsconfig` files apps extend (`base.json`, `node.json`, `react-app.json`)        | Active                                                               |
| `packages/eslint-config` | Shared ESLint flat configs — `web.js` for the React app, `api.cjs` for the NestJS app | Active                                                               |
| `packages/ui`            | Shared React component library, exported from `src/index.ts`                          | Scaffold — populated as `shared/components` graduate from `apps/web` |
| `packages/shared-types`  | Shared TypeScript interfaces used by both frontend and backend                        | Scaffold                                                             |
| `packages/graphql`       | Shared GraphQL schema fragments/documents                                             | Scaffold                                                             |
| `packages/config`        | Shared runtime configuration utilities                                                | Scaffold                                                             |

"Scaffold" packages currently export nothing (`export {}`) — they exist so the workspace wiring (package.json, tsconfig, build target) is in place before the first real export is added, avoiding a later restructuring migration.

**Rule:** code only moves into `packages/*` once it is needed by **both** `apps/web` and `apps/api` (e.g. a shared enum used in GraphQL scalars). Frontend-only shared code belongs in `apps/web/src/shared`, not `packages/ui`, until a second consumer exists.

---

## `database/` — Prisma Schema

```
database/
└── prisma/
    ├── schema.prisma            # Single source of truth for the data model
    ├── seed.ts                   # Seed script (run via `prisma db seed`)
    └── migrations/
        ├── migration_lock.toml     # Locks the migration engine's provider
        └── <timestamp>_<name>/       # One folder per migration
            └── migration.sql
```

- `schema.prisma` is edited directly; migrations are generated from it via `npm run -w @smartsense/api prisma:migrate`, never written by hand.
- The full entity list, relationships, indexing strategy, and constraints added by hand to generated migrations are documented in [database-schema.md](./database-schema.md) — do not duplicate entity descriptions here.
- `apps/api/package.json` points its `"prisma.schema"` and `"prisma.seed"` fields at this folder so `prisma generate` / `prisma migrate` run from the API workspace still resolve the shared schema.

---

## `infrastructure/` — Local & Deployment Infrastructure

```
infrastructure/
├── docker/
│   └── docker-compose.yml              # Full stack: api, db, keycloak, keycloak-db
└── keycloak/
    └── realm-export/
        └── smartsense-marketplace-realm.json   # Auto-imported realm on Keycloak startup
```

| Folder                   | Belongs here                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `docker/`                | Compose files that stand up the full stack for local development or demo environments                         |
| `keycloak/realm-export/` | The exported realm JSON (roles, groups, clients, users) imported automatically via `start-dev --import-realm` |

Full Docker service topology (ports, health checks, dependency order) and Keycloak realm contents (roles, groups, clients) are documented in [keycloak-setup.md](./keycloak-setup.md#docker-architecture) — this section only maps folders to responsibilities.

`apps/api/docker-compose.yml` (API-focused: api + db + keycloak + keycloak-db, for running the API alone against a full auth stack) is a workspace-local convenience file, distinct from the root `infrastructure/docker/docker-compose.yml` (used for full-stack local/demo runs).

---

## `.github/`, `.claude/` — Tooling

| Folder                        | Contents                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`    | CI pipeline: install → generate Prisma client → lint → typecheck → build, on every push/PR to `main`/`development`                                                    |
| `.claude/agents/`             | Subagent definitions (`backend-architect`, `frontend-architect`, `database-architect`, `graphql-architect`, `code-reviewer`, `qa-engineer`) scoped to this repository |
| `.claude/settings.local.json` | Local (untracked-by-convention) Claude Code settings for this repo                                                                                                    |

CI/CD pipeline stages, environments, and release strategy are documented in [deployment.md](./deployment.md).

---

## Dependency Rules Summary

```
                 ┌────────────┐
                 │  packages/  │   consumed by name (@smartsense/*)
                 └─────┬──────┘
                        │
        ┌───────────────┼────────────────┐
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│   apps/web     │                 │   apps/api     │
│                │                 │                │
│ app → features │                 │ modules/*      │
│      → shared  │                 │  → common      │
└───────┬────────┘                 │  → config      │
        │                          │  → prisma      │
        │                          └───────┬────────┘
        │                                  │
        └──────────────┬───────────────────┘
                        ▼
              ┌──────────────────┐
              │ database/prisma   │  schema is the contract
              └──────────────────┘
```

- `apps/web` and `apps/api` never import from each other's `src/`. All contract sharing happens through the GraphQL schema (`apps/api/src/schema.gql`, consumed by `apps/web` via codegen) or through `packages/*`.
- Neither app may import from the other's `node_modules` or reach across the workspace boundary with a relative path (`../../api/src/...`).
- `packages/*` may depend on other `packages/*` but never on `apps/*` — a dependency cycle back into an app would break the "shared code has no app affinity" invariant this structure exists to protect.

---

## Best Practices

1. **New folder, existing pattern first.** Before creating a new top-level folder anywhere in this tree, check whether an existing feature/module already establishes the pattern you need (`features/<name>/graphql`, `modules/<name>/dto`) and follow it — do not invent a parallel convention.
2. **Promote, don't pre-share.** Code starts in the feature/module that needs it. It moves to `shared/`, `common/`, or `packages/*` only when a second, genuine consumer exists.
3. **One barrel per module/feature.** External code imports only through `index.ts`. This is what makes the dependency rules in this document mechanically checkable (via lint rules / code review), not just documented intent.
4. **Generated code is read-only.** `apps/web/src/lib/graphql/__generated__/` and `apps/api/src/schema.gql` are build outputs. Treat a manual edit to either as a bug — regenerate instead (`npm run codegen`, restart the Nest dev server for schema-first regeneration).
5. **Keep the schema the contract.** `database/prisma/schema.prisma` and `apps/api/src/schema.gql` are the two authoritative interfaces between layers. When behavior needs to change, change the schema first, then the code that implements it — not the other way around.
6. **Components under 250 lines** (per [CLAUDE.md](../CLAUDE.md)). If a component in `features/*/components` or `shared/components` grows past that, it is a signal to extract a hook (to `hooks/`) or split the component, not to keep growing the file.
