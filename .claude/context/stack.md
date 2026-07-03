# Technology Stack — SmartSense Marketplace

Details and rationale: [docs/architecture.md](../../docs/architecture.md),
[docs/developer-setup.md](../../docs/developer-setup.md), [docs/deployment.md](../../docs/deployment.md).

## Frontend (`apps/web`)

- React 19, TypeScript (strict), Vite, React Router v7 (nested, lazy routes)
- Tailwind CSS v4 (CSS-first `@theme`; utility-only, no bespoke CSS)
- Apollo Client (`InMemoryCache`, `cache-and-network` default, `errorPolicy: 'all'`)
- React Hook Form + Zod for forms

## Backend (`apps/api`)

- NestJS 11 + Apollo Server 5, **code-first** GraphQL (`schema.gql` is a generated artifact)
- Global guard chain (`GqlAuthGuard → RolesGuard → PermissionGuard`), `AppValidationPipe`
  (`class-validator`), `GlobalExceptionFilter`, `LoggingService`
- Config via `@nestjs/config` + Joi (fail-closed boot validation); REST only for `/health` (Terminus)

## Database

- PostgreSQL 17 (Postgres-specific features: native enums, `jsonb`, `CHECK`/GiST constraints)
- Prisma ORM — schema at `database/prisma/schema.prisma` (single source of truth, outside apps)
- UUID PKs, `Decimal` money, soft delete via `deletedAt`, hand-written constraint SQL in migrations

## Authentication

- Keycloak 26 (Docker), realm `smartsense-marketplace`, auto-imported realm export
- Clients: `smartsense-web` (public, Authorization Code + PKCE), `smartsense-api` (bearer-only)
- RS256 JWTs validated via JWKS; permissions resolved from Postgres per request

## GraphQL

- Single API surface at `/graphql`; additive-only schema evolution, no versioning
- GraphQL Code Generator (client preset, fragment masking) → `apps/web/src/lib/graphql/__generated__/`
- Generated types/hooks only — hand-written GraphQL types are banned

## Testing

- Backend: Jest (unit) + Supertest (integration, real Postgres + mocked JWKS)
- Frontend: Playwright (configured, specs pending M18); Vitest + React Testing Library planned (M10)

## CI/CD

- GitHub Actions (`.github/workflows/ci.yml`): install → prisma generate → lint → typecheck → build
  (test stages are a known gap, TD-2)
- Husky + lint-staged + commitlint (Conventional Commits + mandatory `SM-*` Jira key)

## Monorepo & Tooling

- Turborepo task graph; workspaces: `apps/*`, `packages/*` (`@smartsense/tsconfig`,
  `eslint-config` active; `ui`, `shared-types`, `graphql`, `config` are scaffolds)
- ESLint (flat configs, `no-explicit-any: error`) + Prettier; Node 22; Docker Compose for infra

## Package Manager

- **npm** 11 (`packageManager: npm@11.6.2`), single root lockfile — never pnpm/yarn.
