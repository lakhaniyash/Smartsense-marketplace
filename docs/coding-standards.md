# SmartSense Marketplace — Coding Standards

Version: 1.0

---

## 1. Purpose

### Goals

These standards exist so that:

- Any engineer can read code written by another engineer without first learning that engineer's personal style.
- Code review focuses on logic and design, not on re-litigating formatting or naming choices that should already be settled.
- The codebase stays consistent as it scales across more features, more modules, and more contributors.
- AI-assisted changes (via Claude Code or similar tooling) produce output indistinguishable in style from hand-written code.

### Scope

This document governs **how code is written** — naming, structure, and conventions — across `apps/web` (React/TypeScript), `apps/api` (NestJS/TypeScript), and `database/prisma`. It does not repeat:

| Already covered elsewhere                                                     | See                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| Why the repo is laid out this way, folder responsibilities, import boundaries | [folder-structure.md](./folder-structure.md) |
| Architectural principles, layering, data flow, dependency direction           | [architecture.md](./architecture.md)         |
| Domain entities and business rules                                            | [domain-model.md](./domain-model.md)         |
| Full Prisma schema, ERD, indexing rationale, constraints                      | [database-schema.md](./database-schema.md)   |
| Authentication/authorization flows and guard chain                            | [authentication.md](./authentication.md)     |
| Keycloak realm/client/Docker topology                                         | [keycloak-setup.md](./keycloak-setup.md)     |

This document assumes those are read first where relevant, and links to them instead of restating their content.

---

## 2. General Principles

- **Readability over cleverness.** Code is read far more often than it is written. A longer, obvious implementation beats a shorter, clever one.
- **Simplicity (KISS).** Solve the problem in front of you. Do not build for a requirement that does not exist yet.
- **YAGNI.** Do not add configuration options, abstraction layers, or extension points speculatively. Add them when a second real use case appears.
- **Maintainability.** Optimize for the next engineer's ability to change this code safely, not for how few lines it takes today.
- **SOLID**, applied pragmatically:
  - _Single Responsibility_ — a component, hook, service, or resolver does one thing (see [architecture.md](./architecture.md#api-layer) for the Component → Hook → Service → Apollo Client layering this enables).
  - _Open/Closed_ — prefer adding a new case (a new feature module, a new resolver) over modifying shared code's internals.
  - _Liskov, Interface Segregation, Dependency Inversion_ — apply naturally through NestJS's DI container and small, focused TypeScript interfaces; do not force class hierarchies to satisfy them artificially.
- **DRY, not DRY-at-all-costs.** Extract a shared abstraction on the second or third duplication, not the first. Three near-identical lines are better than a premature, wrong abstraction.
- **Composition over inheritance** (per [CLAUDE.md](../CLAUDE.md)). Build behavior by composing small functions, hooks, and services rather than class hierarchies. The one sanctioned exception in this codebase is `LoggingService extends ConsoleLogger` — required by NestJS's own logger-replacement contract, not a general pattern to imitate.

---

## 3. TypeScript Standards

### Strict Mode

TypeScript strict mode is enabled at the root (`packages/tsconfig/base.json`) and inherited by every workspace. Strict mode is never disabled or narrowed in an individual package or file. Do not add `// @ts-ignore`, `// @ts-expect-error` (without a linked issue), or per-file `strict: false` overrides.

### Avoid `any`

`any` is banned and enforced by ESLint (`@typescript-eslint/no-explicit-any: 'error'` in both `packages/eslint-config/web.js` and `api.cjs`). When a type is genuinely unknown:

- Use `unknown` and narrow it explicitly (via `typeof`, `instanceof`, or a type guard) before use — see `GlobalExceptionFilter.extractMessage` in `apps/api/src/common/filters/global-exception.filter.ts` for the established pattern of narrowing an `unknown` exception.
- Use a generic (`<T>`) if the shape varies by call site but is always known at that call site.
- Never silence the rule with an inline disable comment as a substitute for typing the value correctly.

### Type vs. Interface

| Use `interface` for                                                                                                                            | Use `type` for                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Object shapes that represent an entity, props, or a DTO, especially ones that might be extended (`interface OrderCardProps extends CardProps`) | Unions, intersections, tuples, mapped/conditional types, and function signatures |
| Anything implemented by a class (`implements CanActivate`)                                                                                     | Aliasing a primitive or a GraphQL Code Generator output type                     |

Both are structurally typed in TypeScript — the distinction here is about intent, not capability. Do not mix conventions within the same file for the same kind of shape.

### Enums

- Prefer a Prisma-backed enum (`enum OrderStatus { ... }` in `schema.prisma`, mapped via `@@map` to a Postgres enum — see [database-schema.md](./database-schema.md#design-conventions)) whenever the value set is a genuinely fixed, small state machine that both the database and the application must agree on.
- In application-only TypeScript code, prefer a `const` object with an `as const` assertion and a derived union type over a native TypeScript `enum` — it produces a plain object at runtime (better tree-shaking, no reverse-mapping surprises) and the derived type reads the same as any other union:
  ```ts
  const SORT_DIRECTION = { ASC: 'asc', DESC: 'desc' } as const
  type SortDirection = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION]
  ```
- Never hand-write a TypeScript type or enum that duplicates a GraphQL Code Generator output (`Role`, `OrderStatus`, etc. from `apps/web/src/lib/graphql/__generated__`) or a Prisma-generated enum (`@prisma/client`) — import the generated one.

### Null Handling

- Use `null` for an intentional, meaningful "no value" (a DB column, a resolved-but-empty result). Use `undefined` for "not yet provided" (an optional prop, an unset object field).
- Enable and respect `strictNullChecks` (part of `strict`) — never widen a type with a non-null assertion (`!`) to work around a type error. If a value is truly guaranteed non-null at that point, express it via a type guard, an early return, or a narrowing `if`, so the compiler verifies the guarantee rather than the assertion silently trusting it.
- Optional chaining (`?.`) and nullish coalescing (`??`) are preferred over manual `&&` chains or `||` (which incorrectly treats `0`/`''`/`false` as absent).

### Error Handling (Types)

- Functions that can fail predictably (validation, a not-found lookup) should make that explicit in their return type or throw a specific, typed error/exception — never return `any` or a loosely-typed error object.
- See [§ 10 Error Handling Standards](#10-error-handling-standards) for the full backend/frontend error handling conventions.

### Naming Conventions (TypeScript-specific)

See the consolidated table in [§ 8 Naming Conventions](#8-naming-conventions). TypeScript-specific rules:

- Type parameters use a single uppercase letter (`T`, `K`, `V`) or a descriptive `PascalCase` name prefixed with `T` only when a single letter would be ambiguous (`TFieldValues` in a generic form hook).
- Boolean variables/props read as a predicate: `isLoading`, `hasError`, `canEdit`, never `loading`, `error`, `edit` alone.

---

## 4. React Standards

### Functional Components Only

No class components. Every component is a function using hooks. This is non-negotiable per [CLAUDE.md](../CLAUDE.md) and matches the codebase's current `App.tsx`/`main.tsx` pattern.

### Hooks Rules

- Follow the Rules of Hooks (`eslint-plugin-react-hooks`, enabled in `packages/eslint-config/web.js`) — hooks only at the top level of a component or another hook, never inside conditions, loops, or nested functions.
- Extract a custom hook once a component needs to coordinate more than one piece of related state/effect logic, or once two components need the same stateful logic (see [folder-structure.md](./folder-structure.md#features--feature-modules) for where feature vs. shared hooks live).
- A custom hook name always starts with `use` and returns either a single value, a tuple (for a small, order-sensitive pair like `useState`), or a named object (for three or more values) — never a positional array of more than two items.

### Component Size Guidelines

Components stay under 250 lines (per [CLAUDE.md](../CLAUDE.md)). When a component approaches that limit, the response is one of:

1. Extract non-trivial logic into a hook.
2. Split into smaller subcomponents that compose together.
3. Move a large inline object (a table's column definitions, a form's default values) to a sibling file.

Growing the file further is never the answer.

### Props Design

- Props interfaces are named `<Component>Props` and declared immediately above the component, or imported from a co-located `types.ts` if shared by multiple components in the same folder.
- Prefer explicit, narrow props over a single `data: unknown` blob or spreading an entire GraphQL Code Generator type into props — destructure only the fields the component uses, so the component's dependencies are visible at the call site.
- Boolean props default to `false`-meaning-"off" (`disabled`, not `enabled`), matching native HTML attribute conventions.
- Callback props are named `on<Event>` (`onSubmit`, `onSelectRow`), matching native DOM event handler naming.

### Memoization Guidelines

- Do not reach for `useMemo`/`useCallback`/`React.memo` by default — React's rendering is fast enough for the vast majority of UI. Add memoization only after a measured or clearly predictable performance problem (a large list re-rendering, a callback passed to a memoized child causing it to re-render anyway).
- When a callback is passed to a dependency array of another hook (`useEffect`, `useMemo`), wrap it in `useCallback` so the dependency array is meaningful — that is a correctness concern, not a performance one.

### State Management Guidelines

Follow the escalation order from [architecture.md](./architecture.md#state-management): local component state → React Context → Apollo Cache. Do not introduce a global state library (Redux, Zustand, Jotai, etc.) without a genuine cross-cutting need that Context and Apollo's normalized cache cannot address.

### Event Handling

- Name handlers `handle<Event>` internally (`handleSubmit`, `handleRowClick`) and pass them to `on<Event>`-named props.
- Never inline non-trivial logic in a JSX event handler (`onClick={() => { /* 10 lines */ }}`) — extract a named `handle*` function.

### Accessibility Expectations

- Use semantic HTML elements (`<button>`, `<nav>`, `<table>`) before reaching for a `<div>` with ARIA roles bolted on.
- Every interactive element is keyboard-operable and has a visible focus state.
- Form inputs always have an associated, programmatically-linked `<label>` (via `htmlFor`/`id`, or wrapping).
- Images have meaningful `alt` text; purely decorative images use `alt=""`.
- These map to the WCAG 2.1 AA target set in [architecture.md](./architecture.md#accessibility) — this section states the code-level rules that satisfy it.

---

## 5. GraphQL Standards

### Query Naming

Queries are named as a noun or noun phrase describing what is returned, in `camelCase`, matching the resolver's `@Query(() => Type, { name: '...' })` name: `catalogStatus`, `orders`, `orderById`. Avoid verb prefixes like `getX` — a query is inherently a "get."

### Mutation Naming

Mutations are named `verbNoun` in `camelCase`, describing the state change: `createOrder`, `updateProductVariant`, `cancelOrder`. The verb is always present tense, never past tense (`cancelOrder`, not `cancelledOrder`).

### Fragment Usage

- Define a fragment for any field selection reused across two or more operations. A single-use field selection stays inline.
- Fragment names are `PascalCase` and prefixed with the type they select from: `OrderSummaryFields`, `ProductCardFields`.
- Fragments live beside the operations that use them, under the owning feature's `graphql/` folder (or `shared/graphql/` if genuinely cross-feature) — see [folder-structure.md](./folder-structure.md#appsweb--frontend-application).

### Generated Types Only

Per [CLAUDE.md](../CLAUDE.md): **use GraphQL Code Generator generated types only. Never manually duplicate GraphQL types.** In practice:

- Every `.graphql` document under `src/**/*.graphql` is picked up by `codegen.ts` and emitted into `apps/web/src/lib/graphql/__generated__/`.
- Application code imports the generated hook (`useGetOrdersQuery`) and generated types (`GetOrdersQuery`, `OrderSummaryFieldsFragment`) — never a hand-written interface shadowing a GraphQL type.
- `__generated__/` is a build artifact. Treat any manual edit inside it as a bug; fix the `.graphql` document and re-run `npm run codegen` instead.

### No Handwritten GraphQL Types

If a value's shape is defined by the GraphQL schema, its TypeScript type comes from codegen, full stop — including nested object types and enums (`OrderStatus`, `Role`). A hand-written type that happens to match a generated one today will silently drift the moment the schema changes.

### Error Handling (GraphQL)

- The backend has one global mapping from exception to GraphQL error, implemented once in `GlobalExceptionFilter` (`apps/api/src/common/filters/global-exception.filter.ts`) — resolvers and services throw plain NestJS exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`) and never construct a `GraphQLError` or set `extensions.code` by hand.
- On the frontend, handle GraphQL errors at the Apollo Client link level for cross-cutting concerns (auth expiry, network failure) and at the calling hook/service level for operation-specific messaging — never swallow an error silently.

---

## 6. Backend (NestJS) Standards

### Module Structure

One module per bounded domain context under `apps/api/src/modules/<name>/`, following the shape and subfolder conventions documented in [folder-structure.md](./folder-structure.md#modules--domain-modules). A module declares its own `providers`, `imports`, and an explicit `exports` array — never rely on an unexported provider being reachable from outside the module.

### Controllers / Resolvers

- This API is GraphQL-first — new endpoints are resolvers (`@Resolver()`), not REST controllers. The one sanctioned REST controller is `HealthController` (`/health`), because health checks are consumed by infrastructure (load balancers, container orchestrators) that expect plain HTTP, not GraphQL.
- A resolver's job is to declare the operation shape and delegate to a service. It must not contain business logic or call `PrismaService` directly — see `CatalogResolver` for the pattern: a `@Query`/`@Mutation` method that does nothing but call `this.<name>Service.<method>(...)`.
- Every resolver method has an explicit return type (`@Query(() => String, ...)`) and a `name`/`description` where the GraphQL field name would otherwise be ambiguous.

### Services

- All business logic and all Prisma access for a module live in that module's service. A service's constructor lists its dependencies via NestJS constructor injection (`private readonly x: X`) — never instantiated with `new`.
- A service method does one thing implied by its name; a method that both fetches and mutates in ways the name doesn't suggest is a sign it should be split.

### Dependency Injection

- Depend on abstractions where more than one implementation is plausible (rare in this codebase today); depend directly on the concrete NestJS-managed class otherwise — do not add an interface + token indirection speculatively (YAGNI, [§ 2](#2-general-principles)).
- Global, cross-module providers (`LoggingService`) are registered once via `@Global()` on `CommonModule` and injected wherever needed — never re-instantiated locally.
- Guards registered globally (`APP_GUARD`) are ordered deliberately when order matters — see `AuthModule`'s comment documenting that `GqlAuthGuard` must run before `RolesGuard`/`PermissionGuard` so `req.user` is populated first. Preserve and update that ordering comment if the guard chain ever changes.

### DTOs

- Every GraphQL input and output type is an explicit class decorated with `@InputType()`/`@ObjectType()` and `@Field()` per property (code-first schema) — see `CurrentUserOutput` for the pattern, including using `@Field(() => [String], { description: '...' })` to document non-obvious field semantics (e.g. that `permissions` holds `Permission.key` values).
- DTOs are named `<Name>Input` / `<Name>Output` and live under the module's `dto/` folder.
- A DTO is a plain data shape — it holds no business logic and no Prisma calls.

### Validation

Validation is enforced globally by `AppValidationPipe` (`apps/api/src/common/pipes/validation.pipe.ts`), registered once as `APP_PIPE` in `AppModule`, with:

- `whitelist: true` — strips any property not declared on the DTO.
- `forbidNonWhitelisted: true` — rejects the request instead of silently stripping, if an unknown property is sent.
- `transform: true` with `enableImplicitConversion: true` — converts primitives to the DTO's declared types.
- `stopAtFirstError: true` — fails fast on the first validation error.

Individual DTOs add field-level `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@IsOptional()`, etc.). Do not write manual `if (!input.x) throw ...` validation for anything a `class-validator` decorator already expresses.

### Guards

- A guard has one responsibility: authenticate, or authorize against one specific rule. `GqlAuthGuard` authenticates; `RolesGuard` and `PermissionGuard` each authorize against one metadata key (`ROLES_KEY`, permissions) set via a matching decorator (`@Roles()`, `@Permissions()`).
- Authentication is **opt-out, not opt-in**: a new resolver is protected by default; mark it `@Public()` explicitly when it should not be (see the rationale comment on the `Public` decorator, and [authentication.md § GraphQL Authentication](./authentication.md)). Never build a new guard or resolver that defaults to unauthenticated.
- A guard reads request state (`req.user`) that a prior guard populated — never re-derive it — and documents that ordering dependency in a comment where non-obvious, as `RolesGuard` and `AuthModule` already do.

### Exception Handling

- Throw NestJS's built-in HTTP exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`, `UnauthorizedException`) from services/resolvers for expected failure cases. Do not throw plain `Error` for anything the caller should handle as a specific, typed failure.
- All exception-to-response translation happens once, in `GlobalExceptionFilter` — it dispatches on `GqlArgumentsHost`'s context type (`'graphql'` vs. HTTP) so both the GraphQL API and the REST health endpoint get a consistent, correctly-shaped error without every call site needing to know which transport it's on.
- Never catch an exception in a service or resolver solely to log it and rethrow unchanged — that duplicates what the global filter already does. Catch only to add context, recover, or translate into a different exception type.

### Logging

- Inject `LoggingService` (extends Nest's `ConsoleLogger`) via DI — never call `console.log`/`console.error` directly, and never instantiate `new Logger()` locally. See the comment on `LoggingService` explaining why: once registered via `app.useLogger()`, Nest's static `Logger` delegates back to this service, so wrapping it instead of extending it recurses infinitely.
- Log at the point where an error is first observed with full context (as `GlobalExceptionFilter` does — status, path, message), not redundantly at every layer it passes through.
- Never log secrets, tokens, or full request/response bodies that may contain personal data.

---

## 7. Prisma Standards

The full schema, ERD, and per-relationship rationale live in [database-schema.md](./database-schema.md). This section states the standards a new migration or model must follow — the "why" behind each is explained there in depth.

### Schema Naming

- Prisma models and fields: `PascalCase` models, `camelCase` fields — idiomatic TypeScript, since this is what `@prisma/client` exposes.
- Physical tables and columns: `snake_case`, applied via `@@map("table_name")` / `@map("column_name")` — idiomatic PostgreSQL. Every model and every non-trivial field declares its mapping explicitly; never rely on Prisma's default casing behavior silently matching what you intended.
- Enums follow the same split: `PascalCase` enum name and `SCREAMING_CASE` or `PascalCase` members in Prisma, mapped to a `snake_case` Postgres enum type via `@@map`.

### Relations

- Every relation declares `onDelete`/`onUpdate` explicitly — never rely on Prisma's implicit default. The correct value (`Cascade`, `Restrict`, `SetNull`) is a business decision already made per-relationship in [database-schema.md § Relationships Explained](./database-schema.md#relationships-explained); a new relation follows the same reasoning (financial/historical records are `Restrict`, dependent-with-no-independent-value records are `Cascade`).
- Prefer an explicit join model (like `UserRole`, `RolePermission`) over Prisma's implicit many-to-many the moment the join needs its own attribute (`assignedAt`) or its own `onDelete` behavior per side.
- A cross-table business invariant that Postgres cannot express as a single-row constraint (e.g. "all order items belong to the same partner as the order") is enforced in the service layer, not attempted in the schema — see [database-schema.md § Constraints Not Enforceable at the Database Level](./database-schema.md#constraints-not-enforceable-at-the-database-level).

### Migrations

- Migrations are always generated from `schema.prisma` via `npm run -w @smartsense/api prisma:migrate` — never hand-written from scratch.
- A rule the Prisma schema language cannot express (a `CHECK` constraint, a partial unique index, a GiST exclusion constraint) is added as raw SQL in a clearly marked, hand-written section at the bottom of the generated migration file, and documented in `schema.prisma` as an inline comment at the relevant field — following the precedent in [database-schema.md § Constraints Added by Hand to the Migration](./database-schema.md#constraints-added-by-hand-to-the-migration). Never edit the auto-generated portion of a migration file by hand.
- Every hand-added constraint is verified against a scratch database before being considered done — a constraint that doesn't actually reject invalid data is worse than no constraint, because it implies a guarantee that isn't real.

### Soft Delete Strategy

Not every model is soft-deleted. Whether a new model should be follows the same rule already applied consistently in [database-schema.md § Soft Delete Strategy](./database-schema.md#soft-delete-strategy):

- If the domain model describes the entity as "deactivated" or "archived" rather than destroyed, add a nullable `deletedAt` and filter `WHERE deleted_at IS NULL` at the service layer for every query against it.
- Ledger/financial records and append-only/immutable records are never soft-deleted — they use their own status state machine, or are simply never deleted, respectively.
- Prisma has no built-in global soft-delete filter — the `deletedAt IS NULL` filter must be applied explicitly in every service-layer query against a soft-deletable model. This is the single most common correctness bug to check for in review on any new query.

### Transactions

- Wrap any sequence of writes that must succeed or fail together (e.g. creating an `Order` and its `OrderItem` rows, or updating `Inventory` alongside an `Order` status change) in `prisma.$transaction(...)`. A partial write left behind by a crash mid-sequence is treated as a bug, not an acceptable edge case.
- Keep transactions short — no network calls, no calls to another service, no unrelated reads inside a `$transaction` callback. Fetch what you need first, then transact only the writes (and any reads that must be consistent with them).

### Indexes

Follow the standard already established in [database-schema.md § Indexing Strategy](./database-schema.md#indexing-strategy) for any new query pattern:

- Every foreign key is indexed, either standalone or as the leftmost column of a composite index.
- A composite index pairs a foreign key with the field most commonly filtered alongside it for that access pattern (e.g. `[partnerId, status]`).
- Every soft-deletable model indexes `deletedAt`.
- Add a new index only in response to a real, named query pattern — not speculatively.

---

## 8. Naming Conventions

| Item                                                                     | Convention                                               | Example                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------- |
| Files — components                                                       | `PascalCase.tsx`                                         | `ProductCard.tsx`                         |
| Files — hooks                                                            | `camelCase.ts`, prefixed `use`                           | `useDebounce.ts`                          |
| Files — services                                                         | `camelCase.service.ts` (web), `<name>.service.ts` (api)  | `auth.service.ts`                         |
| Files — GraphQL documents                                                | `camelCase.graphql`                                      | `getOrders.graphql`                       |
| Files — type-only                                                        | `camelCase.types.ts`                                     | `order.types.ts`                          |
| Files — NestJS modules                                                   | `<name>.module.ts`                                       | `catalog.module.ts`                       |
| Files — NestJS resolvers                                                 | `<name>.resolver.ts`                                     | `orders.resolver.ts`                      |
| Files — NestJS guards                                                    | `<name>.guard.ts`                                        | `roles.guard.ts`                          |
| Files — DTOs                                                             | `<name>.input.ts` / `<name>.output.ts`                   | `current-user.output.ts`                  |
| Files — tests                                                            | `<subject>.spec.ts`, co-located                          | `permission.service.spec.ts`              |
| Folders                                                                  | `kebab-case`                                             | `order-timeline/`                         |
| Variables, functions                                                     | `camelCase`                                              | `calculateOrderTotal`                     |
| Boolean variables/props                                                  | `camelCase`, predicate-shaped                            | `isLoading`, `hasError`, `canEdit`        |
| Constants (module-level, immutable)                                      | `SCREAMING_SNAKE_CASE`                                   | `DEFAULT_PAGE_SIZE`                       |
| React components                                                         | `PascalCase`                                             | `ProductCard`                             |
| Hooks                                                                    | `camelCase`, prefixed `use`                              | `useOrderFilters`                         |
| TypeScript types / interfaces                                            | `PascalCase`                                             | `OrderSummary`, `CreateOrderInput`        |
| Enums (application-level `as const`, see [§ 3](#3-typescript-standards)) | `SCREAMING_SNAKE_CASE` object, `PascalCase` derived type | `SORT_DIRECTION`, `SortDirection`         |
| Prisma enums                                                             | `PascalCase` name, `SCREAMING_SNAKE_CASE` members        | `enum OrderStatus { PENDING, CONFIRMED }` |
| GraphQL queries                                                          | `camelCase` noun/noun phrase                             | `orders`, `orderById`                     |
| GraphQL mutations                                                        | `camelCase` verbNoun, present tense                      | `createOrder`, `cancelOrder`              |
| GraphQL fragments                                                        | `PascalCase`, type-prefixed                              | `OrderSummaryFields`                      |

---

## 9. Import Rules

The full alias table and the `app → features → shared` / `modules → common/config/prisma` dependency direction are defined in [folder-structure.md](./folder-structure.md#import-rules-frontend) and [folder-structure.md](./folder-structure.md#import-rules-backend). This section states the code-level conventions for writing an import statement itself.

### Import Ordering

Imports are grouped, in this order, with a blank line between groups:

1. External packages (`react`, `@nestjs/common`, `@apollo/client`).
2. Workspace packages (`@smartsense/ui`, `@smartsense/shared-types`).
3. Absolute app imports via path alias (`@features/...`, `@shared/...`, `@app/...`).
4. Relative imports from the same feature/module (`./types`, `../decorators/roles.decorator`).

Within each group, imports are alphabetized. This is enforced by ESLint/Prettier tooling, not left to manual discipline.

### Absolute Imports

Use the configured path alias (`@shared/components`, `@features/auth`, `@/*` on the backend) for anything outside the current feature/module folder. Relative imports (`../../`) are reserved for files within the same feature or module — a relative import that climbs more than one directory level up is a signal the target should be reached via its alias instead.

### Barrel Exports Policy

Every feature (`features/<name>/index.ts`) and every shared subfolder (`shared/components/index.ts`, etc.) exposes exactly one barrel file. External code imports only through that barrel — never by reaching into an internal file path (`@features/auth/components/LoginForm` is not a valid import; `@features/auth` re-exporting `LoginForm` is). This is what makes the dependency rules in [folder-structure.md](./folder-structure.md#dependency-rules-summary) mechanically enforceable in review, not just documented intent.

Exports are **named exports**, per [CLAUDE.md](../CLAUDE.md) — no default exports. This keeps barrel re-exports (`export { LoginForm } from './LoginForm'`) unambiguous and keeps renames traceable through tooling.

### Circular Dependency Prevention

- A feature never imports another feature (enforced by the `app → features → shared` direction) — this is the primary circular-dependency guard on the frontend.
- A NestJS module only imports what it declares in its own `imports` array and only uses what another module explicitly `exports` — a module reaching into another module's un-exported provider is both a layering violation and a latent circular-dependency risk.
- If two features genuinely need to react to each other, the shared concern moves to `shared/` (frontend) or a common module is introduced (backend) — neither feature/module imports the other directly.

---

## 10. Error Handling Standards

- **Backend:** throw a specific NestJS exception at the point of failure; let `GlobalExceptionFilter` (§ 6) perform the single, centralized translation into an HTTP or GraphQL error shape. Never construct an ad-hoc error response inside a resolver or service.
- **Frontend:** every async page/component supports the four states described in [architecture.md § Loading Strategy](./architecture.md#loading-strategy) — Loading, Empty, Success, Error. An unhandled Apollo error must never render a blank screen; it renders a defined Error state.
- **Never swallow an error silently.** A caught error is either handled meaningfully (recovered, retried, surfaced to the user) or rethrown/logged — never caught and discarded with an empty `catch` block.
- **Fail fast on programmer errors.** Invalid internal state (an impossible enum value, a missing required config value) should throw immediately and loudly, not degrade silently into undefined behavior.
- User-facing error messages are human-readable and actionable; internal error details (stack traces, raw exception messages) are logged, not shown to end users.

---

## 11. Logging Standards

- All backend logging goes through the injected `LoggingService` (§ 6) — never `console.log`. On the frontend, route logging through a shared, replaceable logging utility in `shared/services` rather than calling `console.log` directly from components, per [architecture.md § Logging](./architecture.md#logging) ("Logging implementation should remain replaceable").
- Log levels are used meaningfully: `error` for failures requiring attention, `warn` for recoverable/unexpected-but-handled conditions, `log`/`info` for significant lifecycle events, `debug` for diagnostic detail that's noisy in production.
- Every error log includes enough context to act on without reproducing the request (what operation, what identifier, what the underlying cause was) — see `GlobalExceptionFilter`'s log lines (status, path, message) as the baseline.
- Never log secrets: JWTs, client secrets, passwords, full Authorization headers, or raw PII beyond what's operationally necessary.
- `console.log` left in committed code is a defect — see [§ 16 Definition of Done](#16-definition-of-done).

---

## 12. Comments & Documentation

### When Comments Are Required

Default to **no comment** — a well-named function, variable, and type should make the "what" self-evident. A comment is required only when it captures something the code cannot express on its own:

- A non-obvious invariant or ordering dependency (e.g. the `AuthModule` comment explaining that `GqlAuthGuard` must be registered before `RolesGuard`/`PermissionGuard`).
- The reason for an otherwise-surprising choice (e.g. the `LoggingService` comment explaining why it extends `ConsoleLogger` instead of wrapping `new Logger()` — to prevent infinite recursion once registered as the app's custom logger).
- A deliberate deviation from a rule stated in this document, and why (e.g. `Address` using `isActive` instead of `deletedAt` where every other soft-deletable model uses `deletedAt` — documented in [database-schema.md](./database-schema.md#soft-delete-strategy)).
- A security or business-rule constraint that isn't visible from the code alone (e.g. the `Public()` decorator's comment stating that authentication is opt-out, not opt-in).

Do not write a comment that restates what the next line already says (`// increment counter` above `counter++`), reference the current task/ticket/PR (comments outlive the change that added them), or leave commented-out code in place — delete it; Git history preserves it.

### JSDoc Usage

Use a JSDoc block above a class, method, or exported function when it documents one of the "required" cases above, or when documenting a public API surface consumed outside its own module (a shared hook, an exported service method with non-obvious parameters). Keep it to the minimum needed — a one-to-few-line explanation, not a restatement of the signature. Do not add `@param`/`@returns` tags that just repeat the TypeScript types already visible at the call site.

### TODO / FIXME Conventions

- `TODO(<name or ticket key>): <what and why>` — every TODO is attributable and actionable, e.g. `TODO(SM-241): remove once the reports module ships its own pagination.`
- `FIXME` is reserved for a known-broken behavior currently shipping, not a nice-to-have improvement — use `TODO` for the latter.
- A TODO/FIXME with no ticket reference and no clear next action is not acceptable — it either gets a ticket or gets resolved before merge.
- No `TODO`/`FIXME` reaches `main` — see [§ 16 Definition of Done](#16-definition-of-done).

---

## 13. Git & Commit Message Standards

### Conventional Commits

Enforced by `commitlint` (`commitlint.config.js`) via the `commit-msg` Husky hook — a commit that fails these rules cannot be created:

- Type is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`, `build`.
- Subject is not Start Case, PascalCase, or UPPERCASE.
- Header (the first line) is at most 100 characters.
- Every commit references a Jira issue key matching `SM-\d+`, either in the scope (`feat(SM-235): ...`) or as a footer line (`Jira: SM-235`).
- Every body line is kept under 100 characters (inherited from `@commitlint/config-conventional`'s `body-max-line-length` rule) — write short, single-idea bullet lines rather than long prose or long inline file paths in a commit body.

Example:

```
fix(SM-234): fix DI-breaking lint config and logger recursion
```

### Branch Naming

Branch names use the same type prefixes as commits, `kebab-case`, matching the existing branches in this repository:

```
feat/<short-description>       feat/backend-authentication-integration
fix/<short-description>        fix/di-breaking-lint-config
docs/<short-description>       docs/folder-structure
chore/<short-description>      chore/claude-agents
```

Branch off `development` (not `main`) for new work, per this repository's existing workflow — `main` receives merges from `development` at release points.

### Pull Request Expectations

- A PR title mirrors Conventional Commit style and references the Jira key.
- A PR description states what changed and why, and links the Jira issue.
- `npm run lint && npm run typecheck` pass locally before opening/updating a PR — CI (`.github/workflows/ci.yml`) re-runs install → Prisma generate → lint → typecheck → build on every push/PR to `main`/`development` and is a required, not advisory, check.
- A PR stays scoped to one logical change. Unrelated fixes discovered along the way go in their own commit/PR unless trivially small.

---

## 14. Code Review Checklist

- [ ] No `any`; strict mode respected; no unexplained `@ts-ignore`/`@ts-expect-error`.
- [ ] No hand-written type/interface duplicating a GraphQL Code Generator or Prisma-generated type.
- [ ] New/changed components are functional, under 250 lines, and use named exports.
- [ ] No feature imports another feature's internals; no cross-module reach into an un-exported NestJS provider.
- [ ] All imports go through the correct path alias and through a barrel, not a deep relative path or internal file reach.
- [ ] New Prisma relations declare `onDelete`/`onUpdate` explicitly; new soft-deletable queries filter `deletedAt: null`.
- [ ] New resolvers/services follow the guard-based auth model (protected by default, `@Public()` only when intentional).
- [ ] Errors are thrown as typed exceptions, not swallowed or logged-and-rethrown redundantly.
- [ ] Logging goes through `LoggingService`/the shared frontend logging utility — no `console.log`.
- [ ] Comments explain "why," not "what"; no leftover commented-out code.
- [ ] No unresolved `TODO`/`FIXME` without a ticket reference.
- [ ] Tests exist for new critical logic (guards, services, business rules) and pass.
- [ ] Commit messages and branch/PR naming follow [§ 13](#13-git--commit-message-standards).

---

## 15. Common Anti-Patterns to Avoid

| Anti-pattern                                                  | Why it's a problem                                                                                                         | Instead                                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `any` to silence a type error                                 | Defeats strict mode; hides real bugs until runtime                                                                         | Narrow `unknown`, or fix the actual type mismatch                                  |
| Hand-written type mirroring a GraphQL/Prisma-generated type   | Silently drifts from the schema over time                                                                                  | Import the generated type/hook                                                     |
| Resolver calling `PrismaService` directly                     | Bypasses the service layer's business logic and validation                                                                 | Resolver delegates to the module's service                                         |
| Feature importing another feature's internal file             | Creates hidden coupling the folder structure is designed to prevent                                                        | Move shared logic to `shared/`, or compose at a higher layer                       |
| `console.log` for debugging left in a commit                  | No structured context, not filterable/level-aware, often leaks in production                                               | Injected `LoggingService` / shared frontend logging utility, removed before merge  |
| New query on a soft-deletable model without `deletedAt: null` | Silently returns "deleted" rows as if active — no compiler or runtime safety net                                           | Explicit `deletedAt: null` filter at the service layer                             |
| Catching an exception only to log and rethrow unchanged       | Duplicates `GlobalExceptionFilter`'s job; adds noise, not value                                                            | Let it propagate, or catch only to add real context/recovery                       |
| A new resolver/mutation with no guard consideration           | Given the opt-out auth model, an accidental `@Public()` (or a missing one) is a security-relevant mistake, not a style nit | Confirm intent explicitly; default is authenticated                                |
| Global state library introduced for convenience               | Bypasses the Local State → Context → Apollo Cache escalation and adds unneeded complexity                                  | Escalate through the existing tiers first                                          |
| Non-null assertion (`!`) to work around a type error          | Removes the compiler's guarantee instead of proving it                                                                     | Narrow with a type guard or an explicit check                                      |
| Commit without a Jira key / vague message ("fix stuff")       | Loses traceability between code and the work item that motivated it                                                        | Conventional Commit with a Jira key, per [§ 13](#13-git--commit-message-standards) |

---

## 16. Definition of Done

A change is done when **all** of the following are true:

- [ ] **Lint passes** — `npm run lint` (all workspaces, via Turborepo) is clean.
- [ ] **Typecheck passes** — `npm run typecheck` is clean, with strict mode intact.
- [ ] **Tests pass** — `npm run test` (unit/integration) and, where applicable, `npm run test:e2e` pass. Critical functionality (auth guards, business-rule services, resolvers with authorization logic) has test coverage, per [CLAUDE.md](../CLAUDE.md).
- [ ] **Build succeeds** — `npm run build` completes for every affected workspace.
- [ ] **Documentation updated** — if the change alters architecture, schema, folder structure, or a convention in this document, the relevant doc (this file, [architecture.md](./architecture.md), [database-schema.md](./database-schema.md), [folder-structure.md](./folder-structure.md), etc.) is updated in the same PR, not deferred.
- [ ] **No `console.log`** left in committed source.
- [ ] **No `TODO`/`FIXME`** without a linked ticket reaches `main`.
- [ ] **No unresolved review comments** and the [§ 14 Code Review Checklist](#14-code-review-checklist) has been satisfied.

CI (`.github/workflows/ci.yml`) mechanically enforces install → Prisma client generation → lint → typecheck → build on every push/PR to `main`/`development`; a green CI run is necessary but not sufficient — the checklist items above that CI cannot check (documentation updates, no leftover `console.log`/TODOs, meaningful test coverage) are a reviewer's responsibility.
