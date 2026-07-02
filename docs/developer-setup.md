# SmartSense Marketplace — Developer Setup Guide

Version: 1.0

---

## Purpose

Take a new developer from a fresh machine to a **fully running local stack** — database, Keycloak, API, and frontend — plus the daily-driver commands and the fixes for every known first-day pitfall. This is the practical companion to the reference documentation: where a concept needs explaining, this guide links to its owner instead of re-explaining it.

**Assumptions made explicit.**

1. **This project uses npm workspaces, not pnpm** (`package.json` → `"packageManager": "npm@11.6.2"`). Any instruction you find elsewhere referring to pnpm does not apply here — substituting pnpm will produce a different lockfile and break CI's `npm ci`.
2. **Java is not required.** Keycloak (a Java application) runs exclusively inside Docker (`quay.io/keycloak/keycloak:26.0`) — you never install or run it directly.
3. Commands are written for Linux/macOS shells. Windows developers should use WSL2 (Docker Desktop's default integration).

---

## Prerequisites

- A GitHub account with access to the repository, and an SSH key or token configured for `git clone`.
- Roughly 4 GB of free RAM for the Docker services (two Postgres instances + Keycloak) alongside the Node processes.
- A Jira account — every commit must reference an `SM-*` issue key ([coding-standards.md § 13](./coding-standards.md#13-git--commit-message-standards)); you'll want an issue to work against before your first commit.

## Required Software

| Software                    | Version            | Notes                                                                                                                                                                                                                                             |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**                 | 22.x               | Matches CI (`.github/workflows/ci.yml`) and the API's Docker base image. Use `nvm`/`fnm` to pin.                                                                                                                                                  |
| **npm**                     | 10+ (11 preferred) | Ships with Node 22; the repo pins `npm@11.6.2` as `packageManager`. **Not pnpm** (Assumption 1).                                                                                                                                                  |
| **Docker + Compose v2**     | Current            | Runs PostgreSQL and Keycloak locally. Compose v2 (`docker compose`, not `docker-compose`).                                                                                                                                                        |
| **Git**                     | 2.30+              | Husky hooks require a standard Git install.                                                                                                                                                                                                       |
| **VS Code** _(recommended)_ | Current            | The repo ships workspace settings and extension recommendations in `.vscode/` — accept the "install recommended extensions" prompt (ESLint, Prettier, Prisma). Any editor works; these settings make the format-on-save behavior match the hooks. |
| **Java**                    | —                  | **Not required** (Assumption 2).                                                                                                                                                                                                                  |

## Repository Setup

```bash
git clone git@github.com:lakhaniyash/Smartsense-marketplace.git
cd Smartsense-marketplace
git checkout development          # daily work branches from development, not main
```

Branching, commit format, and PR flow: [coding-standards.md § 13](./coding-standards.md#13-git--commit-message-standards). Short version: `git checkout -b feat/<short-description>` from `development`; every commit is a Conventional Commit carrying an `SM-*` key.

## Install Dependencies

```bash
npm install        # one install at the root — npm workspaces handles all apps/* and packages/*
```

Never run `npm install` inside an individual workspace directory with a package argument unless you intend to change that workspace's dependencies — day-to-day, the root install is the only one you need. Hooks (Husky) self-install via the root `prepare` script.

## Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The dev defaults in both example files work as-is against the Docker services below — in particular, `VITE_GRAPHQL_URL=http://localhost:3000/graphql` matches the API's default `PORT=3000`; if you change one, change the other (dev-only placeholder secrets — see [deployment.md § Environment Configuration](./deployment.md#environment-configuration)). Variable meanings: [authentication.md § Required Environment Variables](./authentication.md#required-environment-variables).

## Docker Services

For local development, run **only the infrastructure** in Docker and the apps via npm (hot reload):

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d db keycloak
# keycloak-db starts automatically (keycloak depends on it)
```

> **⚠️ Do not run `up --build` (the full stack including the `api` container) on `development`:** the API image build is currently broken there — the Docker build context fix hasn't been merged (debt TD-1, [deployment.md](./deployment.md#purpose), Assumption 3). You don't need the API container for local development anyway.

Check status: `docker compose -f infrastructure/docker/docker-compose.yml ps` — wait until `db` is `healthy` and `keycloak` is `healthy` (Keycloak takes ~30s; that's normal).

## PostgreSQL

Running from the compose file above:

| Property    | Value                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Host / port | `localhost:5432`                                                                                                     |
| Database    | `smartsense_marketplace`                                                                                             |
| Credentials | `postgres` / `password` (dev-only)                                                                                   |
| Data        | Persisted in the `postgres_data` volume; survives restarts. Destroy with `down -v` only when you want a clean slate. |

Schema and design rationale: [database-schema.md](./database-schema.md). GUI: `npm run prisma:studio -w @smartsense/api` (browser-based table browser).

## Keycloak

Running from the same compose file, with the realm auto-imported on first start ([keycloak-setup.md](./keycloak-setup.md) owns the full details and verification checklist):

| Property                 | Value                                                         |
| ------------------------ | ------------------------------------------------------------- |
| Console                  | http://localhost:8080 — admin console login `admin` / `admin` |
| Realm                    | `smartsense-marketplace` (auto-imported)                      |
| Test user (Admin role)   | `admin@smartsense.local` / `Admin@12345`                      |
| Test user (Partner role) | `partner.test@smartsense.local` / `Partner@12345`             |

Realm changes don't re-import into a running instance — reset with `down -v` + `up` if you edit the realm export ([deployment.md § Keycloak Deployment](./deployment.md#keycloak-deployment)).

## Prisma

Order matters — the generated client is required before the API can typecheck or run:

```bash
npm run prisma:generate -w @smartsense/api    # 1. generate the client (after every schema change too)
npm run prisma:migrate  -w @smartsense/api    # 2. apply migrations to your local database
npm run prisma:seed     -w @smartsense/api    # 3. seed roles, permissions, admin user, categories
```

The schema lives at `database/prisma/schema.prisma` (not inside `apps/api` — [folder-structure.md § database](./folder-structure.md#database--prisma-schema)). Migration/seed conventions: [api-conventions.md](./api-conventions.md) and [deployment.md § Database Deployment](./deployment.md#database-deployment).

## Backend

```bash
npm run dev -w @smartsense/api    # NestJS watch mode on http://localhost:3000
```

Verify:

```bash
curl http://localhost:3000/health                                        # → 200
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ authStatus }"}'                                        # → {"data":{"authStatus":"auth module initialized"}}
```

`authStatus` is `@Public()`; most operations require a valid JWT ([authentication.md](./authentication.md)). Architecture: [backend-architecture.md](./backend-architecture.md).

## Frontend

```bash
npm run dev -w @smartsense/web    # Vite dev server on http://localhost:5173
```

Or run everything at once from the root: `npm run dev` (Turborepo starts both apps in watch mode). Architecture: [frontend-architecture.md](./frontend-architecture.md).

## GraphQL Codegen

```bash
npm run dev -w @smartsense/api                 # codegen introspects the live schema — API must be running
npm run codegen -w @smartsense/web             # regenerates src/lib/graphql/__generated__/
npm run codegen:watch -w @smartsense/web       # watch mode while writing .graphql documents
```

Codegen reads `VITE_GRAPHQL_URL` and falls back to `http://localhost:3000/graphql` when unset (`apps/web/codegen.ts`) — both match the API's default port. Workflow and generated-file rules: [graphql.md § 10](./graphql.md#10-graphql-code-generator).

## Playwright

```bash
npx playwright install --with-deps      # one-time browser download (Chromium + Firefox)
npm run test:e2e -w @smartsense/web     # runs the suite; auto-starts the Vite dev server
npm run test:e2e:ui -w @smartsense/web  # interactive UI mode
```

Note: the `e2e/` directory currently contains no specs ([testing.md § End-to-End Testing](./testing.md#end-to-end-testing)) — the command succeeds trivially until M18 populates the suites.

## Useful Commands

All from the repository root:

| Command                                                              | Does                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                                                        | Both apps in watch mode (Turborepo)                        |
| `npm run build` / `lint` / `lint:fix` / `typecheck`                  | Across all workspaces                                      |
| `npm run test` / `npm run test:e2e`                                  | Unit tests (API Jest) / e2e (API integration + Playwright) |
| `npm run format` / `format:check`                                    | Prettier over the repo                                     |
| `npm run <script> -w @smartsense/api` (or `web`)                     | Any single-workspace script                                |
| `npm run test:watch -w @smartsense/api`                              | Jest watch mode while developing backend                   |
| `npm run prisma:studio -w @smartsense/api`                           | Database GUI                                               |
| `docker compose -f infrastructure/docker/docker-compose.yml down -v` | **Destroy** local DB + Keycloak state (clean slate)        |

## Troubleshooting

| Symptom                                                                                     | Fix                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck`/`dev` fails with missing `@prisma/client` types                                 | Run `npm run prisma:generate -w @smartsense/api` — required after clone and after every schema change (CI does the same).                                                                                                           |
| API exits at boot with a Joi validation error                                               | A required variable is missing/malformed in `apps/api/.env` — the error names it. Working as designed ([deployment.md § Troubleshooting](./deployment.md#troubleshooting)).                                                         |
| Frontend GraphQL calls fail / codegen can't reach the schema                                | Confirm the API is running on the port `VITE_GRAPHQL_URL` points at (default `3000` on both sides) and that `.env.local` exists.                                                                                                    |
| `docker compose up --build` fails at `prisma:generate`                                      | Known broken on `development` (TD-1) — don't build the `api` image locally; run infra-only + `npm run dev` ([Docker Services](#docker-services)).                                                                                   |
| Keycloak container "unhealthy" for the first ~30 seconds                                    | Normal slow boot (30s healthcheck `start_period`). Investigate only if it stays unhealthy: `docker compose ... logs keycloak`.                                                                                                      |
| Realm edits in `infrastructure/keycloak/realm-export/` don't appear                         | Import only runs on a fresh instance — `down -v` then `up` ([Keycloak](#keycloak)).                                                                                                                                                 |
| Login to `http://localhost:8080` fails with the test users                                  | Test users belong to the `smartsense-marketplace` realm, not the admin console (`master` realm, `admin`/`admin`).                                                                                                                   |
| Commit rejected: "Commit must reference a Jira issue key"                                   | Commitlint requires `SM-<n>` in every commit — `feat(SM-241): ...` or a `Jira: SM-241` footer. Body lines must stay under 100 chars.                                                                                                |
| `MODULE_TYPELESS_PACKAGE_JSON` warning during every commit                                  | Harmless hook noise (debt TD-7, [TASKS.md](./TASKS.md#technical-debt)) — ignore.                                                                                                                                                    |
| Port already in use (3000 / 5173 / 5432 / 8080)                                             | Another process owns it — `lsof -i :<port>`; for 5432, a host-installed Postgres is the usual culprit.                                                                                                                              |
| ESLint auto-fix "breaks" a NestJS service import (`import { type X }` on an injected class) | Should not happen — the rule is disabled in `packages/eslint-config/api.cjs` because type-only imports break Nest DI. If you see it, your editor is using a different ESLint config; fix the editor setup, don't commit the change. |

## Development Workflow

The full loop, referencing owners:

1. Pick an `SM-*` issue ([TASKS.md](./TASKS.md) is the structural backlog; Jira is operational).
2. Branch from `development`: `feat/<short-description>` ([coding-standards.md § 13](./coding-standards.md#13-git--commit-message-standards)).
3. Develop with `npm run dev` + `test:watch`; follow the conventions docs for the layer you're touching ([coding-standards.md](./coding-standards.md), [api-conventions.md](./api-conventions.md), [ui-guidelines.md](./ui-guidelines.md)).
4. Before pushing: `npm run lint && npm run typecheck && npm run test` — the pre-commit hook covers staged-file lint/format, not the full suite.
5. PR into `development`; CI must be green; the [coding-standards.md § 14 review checklist](./coding-standards.md#14-code-review-checklist) applies.
6. Definition of done: [coding-standards.md § 16](./coding-standards.md#16-definition-of-done) — including docs updated in the same PR.

## Updating Dependencies

- Cadence and rules: [TASKS.md § Maintenance Tasks](./TASKS.md#maintenance-tasks) — monthly batches, security advisories preempt, breaking majors get their own task.
- Mechanics: edit the owning workspace's `package.json` (or `npm install <pkg> -w @smartsense/<workspace>`); the single root `package-lock.json` is the only lockfile. Never commit a second lockfile (`pnpm-lock.yaml`, `yarn.lock`).
- Majors are pinned deliberately (Node 22, Postgres 17, Keycloak 26) — bumping one is a reviewed change, not a routine update ([deployment.md § Security During Deployment](./deployment.md#security-during-deployment)).

## Best Practices

- [ ] Run infra in Docker, apps in npm — the fast loop. The full Docker stack is for deployment verification, not daily work (and is currently blocked by TD-1 anyway).
- [ ] `prisma:generate` after every pull that touches `database/prisma/` — make it reflexive.
- [ ] Keep `.env` / `.env.local` out of Git (already ignored); never paste their values into issues or logs.
- [ ] `down -v` is destructive by design — reach for it deliberately (realm changes, corrupt state), not habitually.
- [ ] When the app misbehaves inexplicably: verify against the health/GraphQL curl checks above before debugging your code — half of "my code is broken" is "a service isn't up."
- [ ] Don't fight the hooks — commitlint and lint-staged enforce documented rules; if a hook rejects you, the fix is in the message/code, not `--no-verify`.

## FAQ

| Question                                             | Answer                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do I need pnpm?                                      | No — npm workspaces (Assumption 1). pnpm will generate a foreign lockfile and break CI.                                                                                                                                      |
| Do I need Java for Keycloak?                         | No — Keycloak runs in Docker only (Assumption 2).                                                                                                                                                                            |
| Which login do I use where?                          | Keycloak **admin console**: `admin`/`admin` (master realm). **Application** test logins: the realm users in [Keycloak](#keycloak).                                                                                           |
| Why does the API refuse to start without env vars?   | Fail-closed boot validation, by design ([deployment.md § Deployment Philosophy](./deployment.md#purpose)).                                                                                                                   |
| Can I use SQLite/a local Postgres instead of Docker? | No SQLite — the schema uses Postgres-specific features ([testing.md § Test Database Strategy](./testing.md#database-testing)). A host Postgres 17 works if you point `DATABASE_URL` at it, but Docker is the supported path. |
| Where do I put a new file?                           | [folder-structure.md](./folder-structure.md) — the authoritative placement guide.                                                                                                                                            |
| How do I add a page / API operation / table?         | [frontend-architecture.md](./frontend-architecture.md) / [api-conventions.md](./api-conventions.md) / [database-schema.md](./database-schema.md) + [coding-standards.md § 7](./coding-standards.md#7-prisma-standards).      |
| Why is my commit message rejected?                   | Conventional Commit + `SM-*` key + 100-char lines — see [Troubleshooting](#troubleshooting).                                                                                                                                 |
| Everything is broken and I want to start over        | `docker compose -f infrastructure/docker/docker-compose.yml down -v`, `git clean -fdx -e .env -e .env.local` (careful!), then re-run this guide from [Install Dependencies](#install-dependencies).                          |
