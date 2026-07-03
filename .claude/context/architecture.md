# Architecture Context — SmartSense Marketplace

Owners: [docs/architecture.md](../../docs/architecture.md) (principles),
[docs/frontend-architecture.md](../../docs/frontend-architecture.md) (runtime web),
[docs/backend-architecture.md](../../docs/backend-architecture.md) (module graph),
[docs/api-conventions.md](../../docs/api-conventions.md) (per-request rules),
[docs/folder-structure.md](../../docs/folder-structure.md) (placement & import rules).

## High-Level Architecture

```
Browser → React SPA → Apollo Client → GraphQL API (NestJS) → Prisma → PostgreSQL
                ↘ OIDC redirect ↗ Keycloak ↖ JWKS fetch (API)
```

One GraphQL surface; the only REST endpoint is `/health`. The Prisma schema and `schema.gql`
are the two contracts between layers.

## Application Layers

- **Frontend:** `Page → Hook → Service → Apollo Client → API`. Pages own data fetching and the
  four view states (Loading/Empty/Success/Error); components receive props; hooks wrap generated
  Apollo hooks; services hold imperative logic (auth service is the only Keycloak importer).
- **Backend:** `Resolver → Guards → ValidationPipe → Service → Prisma → Postgres`. Resolvers
  delegate only. Services own all business logic, transactions, and Prisma access ("Repository"
  today = the service's own Prisma calls). Guards run before pipes; one global exception filter.

## Dependency Rules

- Frontend: `app → features → shared`, enforced via aliases and barrels. Features never import
  each other; `shared/` is dependency-terminal. Only `app/config` reads `import.meta.env`;
  only the auth service imports `keycloak-js`.
- Backend: `modules/* → common/ | config/ | prisma/`, never reversed. Cross-module calls only
  through explicitly `export`ed services. No `forwardRef()`, no `@Global()` domain modules,
  no second Prisma client. Only `src/config/` reads `process.env`.
- Apps never import each other's `src/`; contract sharing is the GraphQL schema or `packages/*`.

## Feature-First Architecture

Every frontend feature (`features/<name>/`) has identical anatomy: `pages/ components/ hooks/
graphql/ services/ types/ utils/ constants/ index.ts` (barrel = only public surface). Every
backend bounded context is a NestJS module (`modules/<name>/`): module + resolver + service
(+ `dto/`, `guards/`, `decorators/` as needed). The `auth` module is the reference implementation.

## Shared Packages

Code promotes on the second real consumer: feature → `shared/` (web) or `common/` (api) →
`packages/*` only when **both** apps need it. `packages/ui`, `shared-types`, `graphql`, `config`
are deliberate scaffolds today.

## Data Flow

Query: generated hook → Apollo normalized cache (cache-and-network) → API → guard chain →
resolver → service → Prisma. Mutation: RHF + Zod validates input → handler maps values to the
generated Input type → mutation → normalized cache write re-renders every mounted view (cache
normalization is the only sync mechanism — always select `id`). Errors map to one taxonomy
(`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_USER_INPUT`, `INTERNAL_SERVER_ERROR`) via
`GlobalExceptionFilter`; the Apollo error link (M8) owns session-level reactions.

## Cross-Cutting Invariants

- Auth opt-out (`@Public()` is the exception); permissions gate the verb, service-layer
  ownership checks gate the noun; ownership misses on reads return `NOT_FOUND`.
- Atomic multi-writes use `$transaction` (interactive form; pass ambient `tx`, never nest).
- Soft-deletable queries always filter `deletedAt: null`; server recomputes derived values.
- State escalation: local state → Context → Apollo cache; URL-worthy state lives in the URL.
