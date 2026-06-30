# SmartSense Marketplace

Enterprise marketplace platform — Turborepo monorepo.

---

## Repository Structure

```
apps/
  web/            React frontend (Vite, Apollo Client, Tailwind CSS)
  api/            NestJS GraphQL API (Apollo Server, Prisma)

packages/
  ui/             Shared React component library (scaffold)
  shared-types/   Shared TypeScript interfaces (scaffold)
  graphql/        Shared GraphQL schema and fragments (scaffold)
  config/         Shared runtime config utilities (scaffold)
  eslint-config/  Shared ESLint configurations
  tsconfig/       Shared TypeScript configurations

database/
  prisma/         Prisma schema (single source of truth)

infrastructure/
  docker/         Full-stack Docker Compose

docs/             Architecture and conventions
```

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Monorepo | Turborepo + npm workspaces          |
| Frontend | React 19, Vite 6, TypeScript 5.8    |
| API      | NestJS 11, Apollo Server 5, GraphQL |
| Database | PostgreSQL 17 + Prisma 6            |
| Styling  | Tailwind CSS v4                     |
| Auth     | Keycloak (Phase 3)                  |
| Testing  | Jest (API) + Playwright (Web)       |
| CI       | GitHub Actions                      |

---

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for local database)

---

## Getting Started

```bash
# 1. Install all workspace dependencies
npm install

# 2. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Generate Prisma client
npm run -w @smartsense/api prisma:generate

# 4. Start all apps in dev mode
npm run dev
```

---

## Root Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start all apps in watch mode (Turborepo) |
| `npm run build`     | Build all packages and apps              |
| `npm run lint`      | Lint all workspaces                      |
| `npm run lint:fix`  | Lint + auto-fix all workspaces           |
| `npm run typecheck` | Type-check all workspaces                |
| `npm run test`      | Run all unit tests                       |
| `npm run test:e2e`  | Run all end-to-end tests                 |
| `npm run format`    | Format the entire repo with Prettier     |

---

## Individual App Scripts

Run a script in a specific workspace:

```bash
# Frontend
npm run dev -w @smartsense/web

# API
npm run dev -w @smartsense/api
```

---

## Workspace Packages

| Package                     | Purpose                                |
| --------------------------- | -------------------------------------- |
| `@smartsense/tsconfig`      | Shared TypeScript base configs         |
| `@smartsense/eslint-config` | Shared ESLint configs (web + api)      |
| `@smartsense/ui`            | Shared React component library         |
| `@smartsense/shared-types`  | Shared TypeScript interfaces           |
| `@smartsense/graphql`       | Shared GraphQL schema and fragments    |
| `@smartsense/config`        | Shared runtime configuration utilities |

---

## Docker

Start the full stack:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

Start only the database for local development:

```bash
docker compose -f apps/api/docker-compose.yml up db
```

---

## Turborepo

Tasks are defined in `turbo.json`. The dependency graph ensures packages build before the apps that depend on them.

```
build   → waits for ^build (upstream packages first)
typecheck → waits for ^typecheck
test    → waits for ^build
dev     → persistent, uncached
lint    → parallel, no dependencies
```

Remote caching can be enabled via `npx turbo login`.

---

## Code Quality

- **TypeScript strict mode** across all packages
- **No `any`** enforced by ESLint
- **Shared ESLint configs** via `@smartsense/eslint-config`
- **Shared TypeScript configs** via `@smartsense/tsconfig`
- **Shared Prettier config** via root `.prettierrc`
- **Conventional Commits** enforced by commitlint
- **Pre-commit hooks** — lint-staged runs per workspace

---

## Contributing

1. Branch from `main` — `git checkout -b feat/my-feature`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Run `npm run lint && npm run typecheck` before pushing
4. Keep components under 250 lines
