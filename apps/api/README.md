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
│   ├── auth/             # Auth module (boilerplate)
│   ├── users/            # Users module (boilerplate)
│   ├── catalog/          # Catalog module (boilerplate)
│   ├── orders/           # Orders module (boilerplate)
│   └── billing/          # Billing module (boilerplate)
├── app.module.ts         # Root module
└── main.ts               # Bootstrap
prisma/
└── schema.prisma         # Prisma schema (no models yet)
test/
└── app.e2e-spec.ts       # E2E tests
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

| Variable                | Default       | Description                  |
| ----------------------- | ------------- | ---------------------------- |
| `PORT`                  | `3000`        | HTTP port                    |
| `NODE_ENV`              | `development` | Environment name             |
| `DATABASE_URL`          | required      | PostgreSQL connection string |
| `GRAPHQL_DEBUG`         | `false`       | Enable GraphQL debug mode    |
| `GRAPHQL_INTROSPECTION` | `true`        | Enable schema introspection  |
| `GRAPHQL_PLAYGROUND`    | `false`       | Enable GraphQL Playground    |

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
| LoggingService | CommonModule          | Global |
| PrismaService  | PrismaModule          | Global |

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
