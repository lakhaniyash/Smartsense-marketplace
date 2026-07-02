# SmartSense Marketplace — API

NestJS GraphQL API backend for SmartSense Marketplace.

---

## Tech Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | NestJS 11               |
| Language   | TypeScript 5.8 (strict) |
| API        | GraphQL (code-first)    |
| GraphQL    | Apollo Server 4         |
| ORM        | Prisma 6                |
| Database   | PostgreSQL 17           |
| Validation | class-validator + Zod   |
| Config     | @nestjs/config + Joi    |
| Health     | @nestjs/terminus        |
| Testing    | Jest + Supertest        |

---

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 17 (or Docker)

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Start development server
npm run start:dev
```

---

## Docker

Start the full stack (API + PostgreSQL) with Docker Compose:

```bash
docker compose up --build
```

Start only the database for local development:

```bash
docker compose up db
```

---

## Scripts

| Script                    | Description                     |
| ------------------------- | ------------------------------- |
| `npm run start:dev`       | Start in watch mode             |
| `npm run start:prod`      | Start compiled production build |
| `npm run build`           | Compile TypeScript to `dist/`   |
| `npm run lint`            | Run ESLint                      |
| `npm run lint:fix`        | Run ESLint with auto-fix        |
| `npm run format`          | Format with Prettier            |
| `npm run typecheck`       | Run TypeScript compiler check   |
| `npm run test`            | Run unit tests                  |
| `npm run test:cov`        | Run unit tests with coverage    |
| `npm run test:e2e`        | Run end-to-end tests            |
| `npm run prisma:generate` | Generate Prisma Client          |
| `npm run prisma:migrate`  | Run database migrations         |
| `npm run prisma:studio`   | Open Prisma Studio GUI          |

---

## Folder Structure

```
src/
├── common/
│   ├── filters/          # GlobalExceptionFilter
│   ├── pipes/            # AppValidationPipe
│   ├── services/         # LoggingService
│   └── common.module.ts  # Global CommonModule
├── config/
│   ├── configuration.ts  # Typed config factory
│   └── validation.schema.ts  # Joi env validation
├── health/
│   ├── health.controller.ts  # GET /health
│   └── health.module.ts
├── prisma/
│   ├── prisma.service.ts # PrismaClient wrapper
│   └── prisma.module.ts  # Global PrismaModule
├── modules/
│   ├── auth/             # Keycloak JWT validation, guards, decorators, PermissionService
│   │   ├── decorators/   # @Public, @Roles, @Permissions, @CurrentUser
│   │   ├── dto/          # CurrentUserOutput (me query)
│   │   ├── guards/       # GqlAuthGuard, JwtAuthGuard, RolesGuard, PermissionGuard
│   │   ├── strategies/   # JwtStrategy (JWKS/RS256 verification)
│   │   ├── types/        # AuthenticatedUser, KeycloakJwtPayload
│   │   ├── auth.service.ts        # user provisioning + role sync
│   │   └── permission.service.ts  # Permission resolution/checks
│   ├── users/            # Users module (boilerplate)
│   ├── catalog/          # Catalog module (boilerplate)
│   ├── orders/           # Orders module (boilerplate)
│   └── billing/          # Billing module (boilerplate)
├── app.module.ts         # Root module
└── main.ts               # Bootstrap
prisma/
└── schema.prisma         # Prisma schema (no models yet)
test/
├── app.e2e-spec.ts       # Health + public GraphQL query smoke test
└── auth.e2e-spec.ts      # Full auth pipeline integration test
```

---

## API Endpoints

| Method | Path       | Description      |
| ------ | ---------- | ---------------- |
| GET    | `/health`  | Health check     |
| POST   | `/graphql` | GraphQL endpoint |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                          | Default          | Description                                                                |
| --------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `PORT`                            | `3000`           | HTTP port                                                                  |
| `NODE_ENV`                        | `development`    | Environment name                                                           |
| `DATABASE_URL`                    | required         | PostgreSQL connection string                                               |
| `GRAPHQL_DEBUG`                   | `false`          | Enable GraphQL debug mode                                                  |
| `GRAPHQL_INTROSPECTION`           | `true`           | Enable schema introspection                                                |
| `GRAPHQL_PLAYGROUND`              | `false`          | Enable GraphQL Playground                                                  |
| `KEYCLOAK_URL`                    | required         | Base URL of the Keycloak server                                            |
| `KEYCLOAK_REALM`                  | required         | Realm whose issuer/JWKS the API trusts                                     |
| `KEYCLOAK_API_CLIENT_ID`          | required         | This API's client id — expected token audience                            |
| `KEYCLOAK_API_CLIENT_SECRET`      | optional locally | Confidential client secret (unused until service-account calls are added) |
| `KEYCLOAK_JWKS_URI`               | derived          | Override the JWKS endpoint (e.g. internal Docker hostname)                |
| `KEYCLOAK_JWKS_CACHE_TTL_SECONDS` | `600`            | How long signing keys are cached before re-fetch                          |
| `JWT_CLOCK_TOLERANCE_SECONDS`     | `5`              | Allowed clock drift when validating `exp`/`iat`                           |

---

## Architecture

### Request lifecycle

```
HTTP Request
  → NestJS Platform (Express)
  → GlobalExceptionFilter (catches all errors)
  → AppValidationPipe (validates DTOs)
  → Controller / Resolver
  → Service
  → PrismaService (database)
```

### Module dependency

```
AppModule
  ├── CommonModule (global) → LoggingService
  ├── PrismaModule (global) → PrismaService
  ├── ConfigModule (global) → ConfigService
  ├── GraphQLModule
  ├── HealthModule
  ├── AuthModule
  ├── UsersModule
  ├── CatalogModule
  ├── OrdersModule
  └── BillingModule
```

### Global providers

| Token          | Provider              | Scope  |
| -------------- | --------------------- | ------ |
| `APP_FILTER`   | GlobalExceptionFilter | Global |
| `APP_PIPE`     | AppValidationPipe     | Global |
| `APP_GUARD`    | GqlAuthGuard          | Global |
| `APP_GUARD`    | RolesGuard            | Global |
| `APP_GUARD`    | PermissionGuard       | Global |
| LoggingService | CommonModule          | Global |
| PrismaService  | PrismaModule          | Global |

---

## Authentication & Authorization

Implements the backend half of `docs/authentication.md` on top of the Keycloak
infrastructure provisioned in `docs/keycloak-setup.md`. Every GraphQL
operation is authenticated by default; REST controllers (`/health`) are
untouched by this guard entirely.

### How a request is authorized

1. **JwtStrategy** (`modules/auth/strategies/jwt.strategy.ts`) verifies the
   bearer token's signature via Keycloak's JWKS (RS256, cached by `kid`),
   `exp`, and `iss` (via passport-jwt), then checks `aud`/`azp` manually
   against `KEYCLOAK_API_CLIENT_ID` — Keycloak only puts a client in `aud`
   if an audience mapper is configured, so both claims are checked.
2. **AuthService.validateAndProvisionUser** resolves the token's `sub` to a
   Postgres `User` (falling back to `email` for first-login, never
   fabricating a new user from token claims alone), syncs Keycloak realm
   roles into `UserRole` (fail-closed on unrecognized role names), and
   resolves the user's effective `Permission` set.
3. **GqlAuthGuard** (global `APP_GUARD`) runs this for every GraphQL
   operation except ones marked `@Public()`, and attaches the result to
   `req.user`.
4. **RolesGuard** / **PermissionGuard** (also global, but no-ops unless a
   handler declares `@Roles(...)` / `@Permissions(...)`) enforce
   role/permission requirements after authentication.

### Decorators (`modules/auth/decorators/`)

| Decorator                  | Use                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `@Public()`                 | Opts a resolver out of the global auth guard entirely                |
| `@Roles('Admin', 'Partner')` | Requires the caller to hold at least one listed `Role.name`         |
| `@Permissions('catalog:write')` | Requires the caller to hold every listed `Permission.key` (AND) |
| `@CurrentUser()`             | Method-parameter decorator injecting the resolved `AuthenticatedUser` |

### Errors

Guards throw standard NestJS `UnauthorizedException` (401) /
`ForbiddenException` (403); the existing `GlobalExceptionFilter` already
mapped these to GraphQL `UNAUTHENTICATED` / `FORBIDDEN` error codes, so no
filter changes were needed.

### Known gap

The local Keycloak realm (`infrastructure/keycloak/realm-export/`) does not
yet configure an audience mapper adding `smartsense-api` to tokens issued to
`smartsense-web`. Until that's added, only `azp`-based matching (a
`smartsense-web`-issued token's `azp` won't equal `smartsense-api` either)
or tokens obtained directly for the `smartsense-api` client will pass the
audience check — real frontend-issued tokens will need this realm change
before end-to-end login works. Tracked for the Keycloak infra work, not this
module.

---

## Code Quality

- **TypeScript strict mode** — all strict flags enabled including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **No `any`** — enforced by ESLint (`@typescript-eslint/no-explicit-any: error`)
- **Consistent type imports** — `import type { … }` enforced
- **Pre-commit hooks** — lint-staged runs ESLint + Prettier (via root Husky)

---

## Husky Integration

This package is part of the monorepo under `apps/backend/`. The root Husky pre-commit hook runs lint-staged for both the frontend and backend:

```sh
# .husky/pre-commit (root)
npx lint-staged                        # frontend
npx lint-staged --cwd apps/backend     # backend
```
