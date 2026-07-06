# SmartSense Marketplace — GraphQL Architecture & Development Guide

Version: 1.0

---

## Scope of This Document

This document governs **GraphQL architecture, schema design, and client/server development practices** for SmartSense Marketplace. It is the single source of truth for how the GraphQL API is structured and how it is consumed.

It deliberately does **not** cover topics owned elsewhere — refer to those documents instead of expecting duplicate coverage here:

| Topic                                                                     | Owning document                              |
| ------------------------------------------------------------------------- | -------------------------------------------- |
| Why the repo/app is laid out this way, folder responsibilities            | [folder-structure.md](./folder-structure.md) |
| General architectural principles, layering, data flow                     | [architecture.md](./architecture.md)         |
| TypeScript/React/NestJS/Prisma coding standards, naming at the code level | [coding-standards.md](./coding-standards.md) |
| JWT validation, guard chain, roles/permissions, session management        | [authentication.md](./authentication.md)     |
| Keycloak realm/client/Docker topology                                     | [keycloak-setup.md](./keycloak-setup.md)     |
| Domain entities and business rules                                        | [domain-model.md](./domain-model.md)         |
| Prisma schema, relations, indexing, constraints                           | [database-schema.md](./database-schema.md)   |

**Assumption made explicit:** at the time of writing, the schema exposes only bootstrapping/placeholder operations (`authStatus`, `catalogStatus`, `ordersStatus`, `billingStatus`, `usersStatus`, `me`) — see [apps/api/src/schema.gql](../apps/api/src/schema.gql). This document defines the conventions the real domain schema (Catalog, Orders, Billing queries/mutations) must follow as it is built, rather than describing operations that do not exist yet. Every example below is either drawn from the current schema or explicitly marked as an illustrative pattern for future modules.

---

## 1. Purpose

### Why GraphQL Was Chosen

- **One typed contract for a multi-client platform.** Admin, Partner, and Customer roles ([requirements.md](./requirements.md#user-roles)) view overlapping but different slices of the same data (a Partner's own Orders vs. an Admin's view across all Partners). GraphQL lets each client request exactly the shape it needs from one schema, instead of maintaining REST endpoints per role/view.
- **End-to-end type safety.** GraphQL Code Generator (§ 10) turns the schema into typed documents (`TypedDocumentNode`) consumed directly by Apollo Client's `useQuery`/`useMutation` in React components — the same schema is the contract for both the NestJS resolvers and the frontend, eliminating a whole class of "backend changed the shape, frontend didn't notice until runtime" bugs. This is why [CLAUDE.md](../CLAUDE.md) mandates generated types only, never hand-written GraphQL types.
- **A single introspectable schema doubles as living documentation** for a domain with as many interrelated entities as this one ([domain-model.md](./domain-model.md) lists sixteen), reducing drift between "what the API does" and "what's documented."

### Benefits Over REST for This Project

| Concern                      | REST                                                                                                              | GraphQL (this project)                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Over/under-fetching          | Fixed response shape per endpoint; dashboard views often need custom endpoints or multiple round-trips            | Caller selects exactly the fields it needs in one request        |
| Aggregating across relations | Typically requires a bespoke "composite" endpoint per screen (e.g. an Order with its Items, Invoice, and Partner) | A single query traverses relations declared in the schema        |
| Client-driven evolution      | Adding a field to a UI often requires a new/versioned endpoint                                                    | Adding a field to an existing type is additive and non-breaking  |
| Type safety across the wire  | Requires a separately maintained OpenAPI spec kept in sync by hand                                                | Schema _is_ the contract; codegen derives types directly from it |

### Scope of GraphQL Within the System

- GraphQL is the **only** application API surface. The one exception is `/health` ([folder-structure.md § common, config, health, prisma](./folder-structure.md#common-config-health-prisma)), a plain REST endpoint because it's consumed by infrastructure (load balancers, container orchestrators) that expects plain HTTP, not a GraphQL query.
- Every domain module (`auth`, `users`, `catalog`, `orders`, `billing`) exposes its public API as GraphQL queries/mutations from its resolver — see [folder-structure.md § modules — Domain Modules](./folder-structure.md#modules--domain-modules) for where resolvers live.
- Authentication and authorization enforcement at the GraphQL layer are owned by [authentication.md § GraphQL Authentication](./authentication.md#graphql-authentication) — this document assumes that guard chain exists and focuses on schema/query/mutation design on top of it.

---

## 2. Architecture Overview

### GraphQL Server Architecture

The API is a **code-first** GraphQL server: the schema is derived from TypeScript classes and decorators (`@ObjectType`, `@Field`, `@InputType`, `@Resolver`, `@Query`, `@Mutation`) rather than hand-written SDL. NestJS's `GraphQLModule` (configured once in `apps/api/src/app.module.ts`) drives Apollo Server underneath and regenerates `apps/api/src/schema.gql` on every server start:

```ts
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useFactory: (config: ConfigService) => ({
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: config.get<boolean>('graphql.playground') ?? false,
    introspection: config.get<boolean>('graphql.introspection') ?? true,
    debug: config.get<boolean>('graphql.debug') ?? false,
  }),
})
```

`schema.gql` is committed to the repository (it carries the `THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)` banner) so the schema is reviewable in a pull request diff — but it is a **build artifact**, not a source file. The source of truth is always the TypeScript resolver/DTO code; never hand-edit `schema.gql`.

### Apollo Server

- **Driver:** `@nestjs/apollo` + `@apollo/server` (v5), integrated via `@as-integrations/express5` (see `apps/api/package.json`).
- **Playground/introspection/debug** are all environment-driven (`GRAPHQL_PLAYGROUND`, `GRAPHQL_INTROSPECTION`, `GRAPHQL_DEBUG`), never hardcoded — see [§ 12 Security Considerations](#12-security-considerations) for the production posture.
- **Error formatting** is not handled by Apollo's defaults — it is centralized in `GlobalExceptionFilter` (`apps/api/src/common/filters/global-exception.filter.ts`), which dispatches on `GqlArgumentsHost`'s context type so both GraphQL and the REST health endpoint get consistently shaped errors from one place. See [§ 11 Error Handling](#11-error-handling).

### Apollo Client

- Configured once in `apps/web/src/lib/apollo/client.ts`, exported as a singleton `apolloClient` and provided app-wide via `Providers` (`apps/web/src/app/providers`) — see [folder-structure.md § lib](./folder-structure.md#lib--third-party-client-wiring).
- Uses `InMemoryCache` with project-wide default `fetchPolicy`/`errorPolicy` (§ 9) rather than per-call overrides as the default state, with per-operation overrides only where a query's semantics require it.

### Request Lifecycle

```mermaid
sequenceDiagram
    participant UI as React Component
    participant Hook as Generated Apollo Hook
    participant Client as Apollo Client (cache)
    participant Link as HTTP Link
    participant Server as Apollo Server (NestJS)
    participant Guard as GqlAuthGuard / RolesGuard / PermissionGuard
    participant Resolver as Resolver
    participant Service as Service (Prisma)

    UI->>Hook: useXQuery() / useXMutation()
    Hook->>Client: read cache / execute operation
    alt Cache hit (fetchPolicy allows it)
        Client-->>Hook: cached data
    else Network request required
        Client->>Link: POST /graphql { query, variables }
        Link->>Server: HTTP request
        Server->>Guard: authenticate + authorize
        alt Denied
            Guard-->>Server: throw (Unauthenticated/Forbidden)
            Server-->>Link: GraphQL error response
        else Allowed
            Guard->>Resolver: invoke with AuthContext
            Resolver->>Service: delegate business logic
            Service-->>Resolver: domain result
            Resolver-->>Server: typed response
            Server-->>Link: GraphQL response (data + errors)
        end
        Link-->>Client: response
        Client->>Client: normalize + write to cache
        Client-->>Hook: data / error / loading
    end
    Hook-->>UI: render
```

This mirrors the layered flow already defined in [architecture.md § API Layer](./architecture.md#api-layer) (`Component → Hook → Service → Apollo Client → GraphQL API`); the diagram above is the GraphQL-specific expansion of that same flow, including the guard chain from [authentication.md](./authentication.md#graphql-authentication).

---

## 3. Schema Organization

### Module-Based Schema Design

The schema is composed from independent NestJS modules — there is no single monolithic schema file. Each domain module contributes its own types, queries, and mutations, and `GraphQLModule`'s code-first autogeneration merges them into one schema at boot. This mirrors [folder-structure.md § modules — Domain Modules](./folder-structure.md#modules--domain-modules) exactly: one module per bounded context (`auth`, `users`, `catalog`, `orders`, `billing`), each owning the slice of the schema that corresponds to its domain.

### File Organization

Per module, GraphQL-relevant backend files follow the pattern already established by `auth`:

```
modules/<name>/
├── <name>.resolver.ts     # @Query / @Mutation entry points
├── <name>.service.ts      # business logic + Prisma access (never called directly by other modules' resolvers)
└── dto/
    ├── <name>.input.ts      # @InputType() — mutation/query arguments
    └── <name>.output.ts     # @ObjectType() — response shapes (when not just a Prisma-mirrored entity type)
```

On the frontend, GraphQL documents live beside the feature that owns them, per [folder-structure.md § features — Feature Modules](./folder-structure.md#features--feature-modules):

```
features/<name>/graphql/
├── queries/       # .graphql query documents
├── mutations/     # .graphql mutation documents
└── fragments/     # .graphql fragment documents, if the feature defines any of its own
```

A flat `graphql/*.graphql` folder (no queries/mutations/fragments subfolders) is acceptable while a feature has only a handful of operations; split into subfolders once a feature's `graphql/` folder grows past roughly ten documents.

### Query Separation

Each query is its own named operation in its own `.graphql` document (`getOrders.graphql`, `getOrderById.graphql`), never multiple unrelated queries batched into a single document — this keeps codegen's generated hook names traceable 1:1 to a single call site's intent.

### Mutation Separation

Same rule as queries: one mutation per document (`createOrder.graphql`, `cancelOrder.graphql`). A screen that needs several mutations imports several generated hooks, rather than one document defining several operations.

### Future Subscription Support

No subscriptions exist yet. When real-time features are needed (e.g. live order status updates for a Partner dashboard), they will:

- Live in the owning module exactly like queries/mutations (`@Subscription()` in the module's resolver), not a separate "realtime" module.
- Use `graphql-ws` (the modern, maintained protocol) rather than the legacy `subscriptions-transport-ws`.
- Follow the same naming convention as queries — a noun/noun-phrase describing the event stream (`orderStatusChanged`), not a verb.

This is a forward-looking placeholder, not a currently implemented capability.

### Shared Types

A type used by more than one module's schema (e.g. a future `PageInfo` for pagination, § 5) is defined once in a shared location rather than redeclared per module:

- **Backend:** a `common/graphql/` folder (sibling to `common/filters`, `common/pipes` — see [folder-structure.md](./folder-structure.md#common-config-health-prisma)) for cross-module `@ObjectType()`/`@InputType()` classes, once a second module needs one. Until then, a type stays in the module that defined it.
- **Frontend:** `packages/graphql` ([folder-structure.md § packages](./folder-structure.md#packages--shared-workspace-packages)) is reserved for schema fragments genuinely shared across the workspace; today it is a scaffold package with no exports yet.

---

## 4. Schema Design Principles

### Naming Conventions

| Element               | Convention                                                                         | Example                                   |
| --------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| Query field           | `camelCase` noun/noun phrase                                                       | `orders`, `orderById`, `catalogStatus`    |
| Mutation field        | `camelCase` verb + noun, present tense                                             | `createOrder`, `cancelOrder`              |
| Object type           | `PascalCase` noun                                                                  | `CurrentUser`, `Order`, `ProductVariant`  |
| Input type            | `PascalCase`, suffixed `Input`                                                     | `CreateOrderInput`, `UpdateProductInput`  |
| Payload/response type | `PascalCase`, suffixed `Payload` when it's a mutation's dedicated response wrapper | `CreateOrderPayload`                      |
| Enum type             | `PascalCase`, mirrors the Prisma enum it represents                                | `OrderStatus`, `ProductStatus`            |
| Enum values           | `SCREAMING_SNAKE_CASE`, matching the Prisma enum members                           | `PENDING`, `CONFIRMED`                    |
| Fragment              | `PascalCase`, type-prefixed                                                        | `OrderSummaryFields`, `ProductCardFields` |

These match, by design, the code-level naming rules already defined in [coding-standards.md § 8 Naming Conventions](./coding-standards.md#8-naming-conventions) — this table exists to state the _schema-facing_ (SDL-visible) form of the same rules, not to introduce a second standard.

### Type Naming

An object type name describes the domain concept, never the operation that returns it (`Order`, not `OrderResult` or `GetOrderResponse`). The one exception is a dedicated mutation payload type (see below), where the `Payload` suffix is intentional and load-bearing.

### Input Naming

Every mutation with more than one argument takes a single `Input` object rather than multiple scalar arguments — see [§ 6 Mutations § Input Object Pattern](#input-object-pattern). The input type is named after the mutation it serves: `createOrder(input: CreateOrderInput!)`.

### Enum Naming

A GraphQL enum exists only when a corresponding Prisma enum exists (per [database-schema.md § Design Conventions](./database-schema.md#design-conventions), enums are reserved for genuinely fixed state machines). The GraphQL enum name and its values mirror the Prisma enum exactly — no renaming across the two layers. This is what lets `@nestjs/graphql`'s code-first mapping and GraphQL Code Generator both produce one consistent `OrderStatus` type used identically on both ends of the wire.

### Payload Design

A mutation that only needs to return the affected entity returns that entity's type directly (see `me: CurrentUser!` in the current schema). A mutation that needs to return more than one distinct thing (the entity **and** a list of validation warnings, or the entity **and** a computed side effect) returns a dedicated `<Name>Payload` type instead of overloading the entity type or adding ad-hoc top-level fields to unrelated types.

Illustrative pattern (no such mutation exists yet):

```graphql
type CreateOrderPayload {
  order: Order!
  warnings: [String!]!
}
```

### Consistency Rules

- A field means the same thing everywhere it appears. If `status` on `Order` is an `OrderStatus` enum, no other type introduces an unrelated field also called `status` with different semantics.
- Nullability is deliberate, not incidental: a field is non-null (`!`) unless there's a real, documented case where it's absent. Prefer modeling "not yet available" as a nullable field over a sentinel value (empty string, `-1`).
- List fields are always non-null lists of non-null items (`[Order!]!`) unless the distinction between "empty list" and "null/unknown" is meaningful for that specific field — the common case is "no items yet," which is an empty list, not `null`.

---

## 5. Queries

### Design Principles

- A query name and its return type make the query's purpose obvious without reading its resolver (`orderById(id: ID!): Order`, not `getOrder(input: OrderQuery): OrderResponse`).
- Prefer several small, purpose-built queries over one large query with many optional arguments toggling unrelated behavior — this keeps caching (§ 9) predictable, since Apollo's cache keys are derived from the query + variables.
- A query resolver never accepts pagination/filter/sort arguments it silently ignores — every declared argument is honored.

### Pagination

Once list queries exist, this project standardizes on **cursor-based (Relay-style connection) pagination** for any list that can grow unbounded (`orders`, `products`) — offset pagination is reserved for small, bounded, admin-only lists where jumping to an arbitrary page is a genuine requirement.

```graphql
type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
}

type OrderEdge {
  cursor: String!
  node: Order!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  orders(
    first: Int
    after: String
    filter: OrderFilterInput
    sort: OrderSortInput
  ): OrderConnection!
}
```

`PageInfo` and the `<Type>Connection`/`<Type>Edge` pattern are shared types (§ 3) defined once and reused by every paginated list query, not redeclared per entity.

### Filtering

A list query's filter arguments are grouped into a single `<Type>FilterInput` rather than a growing list of individual scalar arguments — this keeps the query signature stable as filter criteria are added over time (additive, non-breaking) and matches the Input Object Pattern used for mutations (§ 6).

```graphql
input OrderFilterInput {
  status: OrderStatus
  partnerId: ID
  createdAfter: DateTime
  createdBefore: DateTime
}
```

### Sorting

A dedicated `<Type>SortInput` (or a simple enum for single-field sorts) rather than a raw string field name — this keeps sortable fields discoverable via introspection and type-checked by codegen, instead of relying on a string the client must get exactly right.

```graphql
enum OrderSortField {
  CREATED_AT
  TOTAL
}

input OrderSortInput {
  field: OrderSortField!
  direction: SortDirection!
}
```

### Searching

Free-text search is a filter field (`search: String` on the relevant `<Type>FilterInput`), not a separate top-level query — a search is conceptually "the same list, narrowed," which keeps it composable with the list's other filters, pagination, and sorting rather than forcing the client to choose between "browse" and "search" as different operations.

### Field Selection

GraphQL's core value proposition — the client selects only the fields it needs. Resolvers must not assume a specific field selection when doing data-fetching, since consumers legitimately request different subsets; this is what makes DataLoader batching (§ 13) safe rather than an optimization that only works for one caller's shape.

---

## 6. Mutations

### Naming Standards

`verbNoun`, present tense, `camelCase` — see [§ 4 Naming Conventions](#naming-conventions). The verb states the effect precisely: `createOrder` creates, `updateOrder` updates one or more fields, `cancelOrder` transitions state — these are not interchangeable even when their implementations might overlap.

### Input Object Pattern

Every mutation with more than one logical argument takes exactly one argument: a single `<Name>Input` object.

```graphql
input CreateOrderInput {
  customerId: ID!
  partnerId: ID!
  items: [CreateOrderItemInput!]!
  shippingAddressId: ID
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
}
```

Rationale: a single input object is additive-evolvable (new optional fields never break existing callers or require touching every call site), matches the DTO pattern already used server-side ([coding-standards.md § DTOs](./coding-standards.md#dtos)), and gives GraphQL Code Generator one clean generated input type per mutation instead of a positional-argument list.

### Payload Object Pattern

See [§ 4 Payload Design](#payload-design). Default to returning the affected entity directly; introduce a dedicated `<Name>Payload` type only when the mutation genuinely needs to return more than the entity itself.

### Validation Expectations

- Structural/type validation (required fields, string formats, ranges) is expressed on the Input DTO via `class-validator` decorators, exactly as described in [coding-standards.md § Validation](./coding-standards.md#validation) — the global `AppValidationPipe` enforces it before the resolver body ever runs.
- Business-rule validation (e.g. "all order items must belong to the same Partner as the order," [database-schema.md § Constraints Not Enforceable at the Database Level](./database-schema.md#constraints-not-enforceable-at-the-database-level)) happens in the service layer, never in the resolver or the input DTO.
- A mutation never trusts client-supplied derived values (e.g. an `Order.total`) — these are always recomputed server-side.

### Error Handling (Mutations)

See [§ 11 Error Handling](#11-error-handling) for the full model. In short: a mutation throws a typed NestJS exception on failure; it does not return a `{ success: boolean, error: String }`-shaped payload as a substitute for GraphQL's own error channel.

---

## 7. GraphQL Types

| Kind                        | Current usage                                                                                                                              | Convention                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Object Types**            | `CurrentUser` (`CurrentUserOutput` class, `@ObjectType('CurrentUser')`)                                                                    | One `@ObjectType()` class per domain concept; field descriptions via `@Field(() => T, { description })` wherever the field name alone doesn't fully convey meaning, as `CurrentUser.permissions`/`roles` already do.                                                                                                                                                |
| **Input Types**             | None yet (no mutations exist yet)                                                                                                          | `@InputType()` classes under the module's `dto/` folder, one per mutation/complex filter, per § 6.                                                                                                                                                                                                                                                                  |
| **Enums**                   | None exposed in GraphQL yet; Prisma enums exist (`OrderStatus`, `ProductStatus`, etc.)                                                     | Register a Prisma enum with `registerEnumType()` once it's exposed through the schema — never redeclare its members by hand in a second location.                                                                                                                                                                                                                   |
| **Scalars**                 | Built-in scalars only (`String`, `ID`, `Boolean`, `Int`, `Float`) plus `graphql`'s `ID` used for all primary keys                          | `ID` for every entity identifier (matches `Prisma`'s UUID primary keys, [database-schema.md](./database-schema.md#design-conventions)), never a raw `String` for a field that is structurally an identifier.                                                                                                                                                        |
| **Interfaces**              | None yet                                                                                                                                   | Reserved for genuine polymorphism (e.g. a future unified "Notification" interface across multiple concrete event types) — do not introduce an interface for types that merely share a few field names coincidentally.                                                                                                                                               |
| **Unions**                  | None yet                                                                                                                                   | Reserved for a field that can genuinely return one of several unrelated types (e.g. a search-everything result across `Product \| Order \| Partner`) — not a substitute for a well-designed nullable-field object type.                                                                                                                                             |
| **Custom Scalars (future)** | None yet — `Decimal` money fields ([database-schema.md](./database-schema.md#design-conventions)) currently need a representation decision | When added, a custom `DateTime` and/or `Decimal`/`Money` scalar should be introduced once, in the shared types location (§ 3), with explicit serialize/parseValue/parseLiteral behavior documented alongside it — not left as a plain `String` or `Float` (the latter risking the exact floating-point issue the database layer already avoids by using `Decimal`). |

---

## 8. Fragments

### When to Use

Define a fragment the moment a field selection is used by **two or more** operations (a list view and a detail view both showing an order's summary fields, for example). A selection used by exactly one operation stays inline in that operation's document — a single-use fragment adds an indirection with no benefit.

### Organization

Fragments live beside the operations that use them, in the owning feature's `graphql/fragments/` folder (§ 3), or in `shared/graphql/` ([folder-structure.md § shared](./folder-structure.md#shared--cross-feature-reusable-code)) once a fragment is genuinely needed by more than one feature.

### Reusability

```graphql
fragment OrderSummaryFields on Order {
  id
  status
  total
  createdAt
}

query GetOrders {
  orders {
    ...OrderSummaryFields
  }
}

query GetOrderById($id: ID!) {
  orderById(id: $id) {
    ...OrderSummaryFields
    items {
      ...OrderItemFields
    }
  }
}
```

GraphQL Code Generator's client preset (§ 10) enables **fragment masking** (`fragmentMasking: { unmaskFunctionName: 'getFragmentData' }`, already configured in `apps/web/codegen.ts`) — a component that receives fragment data must unwrap it explicitly via `getFragmentData(OrderSummaryFieldsFragmentDoc, data)` rather than accessing fields directly off the parent query result. This keeps a component's actual data dependency (which fragment it uses) visible and enforced by the type system, instead of implicitly relying on whatever the parent query happened to fetch.

---

## 9. Apollo Client Strategy

### Cache Strategy

`InMemoryCache` (Apollo Client's default normalized cache), configured once in `apps/web/src/lib/apollo/client.ts`. No custom `typePolicies` exist yet; add one only when a specific type needs non-default identification or merge behavior (see Cache Normalization below), not preemptively.

### Cache Normalization

Apollo normalizes objects by `__typename` + `id` by default — every object type that has an `id: ID!` field (which, per § 7, is every entity type) is normalized automatically, meaning a given `Order` fetched via two different queries resolves to the same cache entry and updates consistently everywhere it's rendered. This is the reason [§ 4 Consistency Rules](#consistency-rules) requires `id` to always be selected/exposed on entity types — a fragment or query that omits `id` breaks normalization for that object.

### Fetch Policies

Project-wide defaults, set once in `apolloClient`'s `defaultOptions` rather than per-call:

| Operation kind                                                     | Policy              | Rationale                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watchQuery` (hooks used by components, e.g. `useXQuery`)          | `cache-and-network` | Renders cached data instantly, then reconciles with a fresh network response — avoids a loading flash on cached navigation while keeping data fresh. |
| One-off `query` calls (imperative, e.g. inside a service function) | `network-only`      | An imperative query is almost always asked because the caller needs the current server state, not a possibly-stale cache read.                       |

Override at the call site only for a specific, justified reason (e.g. `cache-first` for genuinely static reference data) — document the override with a short comment stating why it deviates from the default.

### Optimistic Updates

Not currently used (no mutations exist yet). When introduced for a mutation with an obviously predictable result (e.g. toggling a boolean flag, or appending an item whose shape is fully known client-side), use Apollo's `optimisticResponse` so the UI updates immediately, then reconciles with the real server response. Do not use optimistic updates for a mutation whose result depends on server-computed values (totals, generated IDs beyond what the client already knows) that the client cannot predict correctly — a wrong optimistic guess that gets corrected a moment later is worse UX than a brief loading state.

### Error Policies

`errorPolicy: 'all'` is the project-wide default for both `watchQuery` and `query` (see `apolloClient`'s `defaultOptions`) — a response with partial data and errors returns both, rather than Apollo's default of discarding data entirely when any error is present. This lets a component render whatever data did come back and handle the error state for the specific missing piece, consistent with [architecture.md § Loading Strategy](./architecture.md#loading-strategy)'s four-state (Loading/Empty/Success/Error) requirement — a partial-error response often still has a meaningful "Success" state to render alongside a smaller, scoped error.

---

## 10. GraphQL Code Generator

### Purpose

Generates TypeScript types and typed React hooks directly from the schema and the app's own `.graphql` documents, so the frontend never hand-maintains a type that could drift from the backend schema — the concrete mechanism behind [CLAUDE.md](../CLAUDE.md)'s "Use GraphQL Code Generator generated types only. Never manually duplicate GraphQL types."

### Generated Artifacts

Configured in `apps/web/codegen.ts` using the `client` preset:

```ts
const config: CodegenConfig = {
  overwrite: true,
  schema: process.env['VITE_GRAPHQL_URL'] ?? 'http://localhost:3000/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.gql'],
  generates: {
    'src/lib/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
  ignoreNoDocuments: true,
}
```

This produces, per operation/fragment document, a typed `TypedDocumentNode<TResult, TVariables>` (e.g. `MeDocument`) plus its corresponding TypeScript result/variables types (e.g. `MeQuery`, `MeQueryVariables`) in `graphql.ts`. **Correction (verified building M8, 2026-07-03):** the `client` preset alone does not generate named hooks like `useGetOrdersQuery()` — that requires additionally configuring `@graphql-codegen/typescript-react-apollo`, which `codegen.ts` does not do. The established pattern is instead Apollo Client's own `useQuery(MeDocument)` / `useMutation(...)`, which infer their result/variable types directly from the `TypedDocumentNode` — fully typed with no extra plugin, per `features/auth/hooks/useCurrentUser.ts`. Adding the react-apollo plugin later (for the convenience of a named hook per operation) is a valid future choice, not a currently implemented one.

### Development Workflow

1. Backend: add/modify a resolver, DTO, or type. Start (or restart) the Nest dev server — `autoSchemaFile` regenerates `apps/api/src/schema.gql` automatically (§ 2).
2. Frontend: write or update a `.graphql` document under the owning feature's `graphql/` folder.
3. Run `npm run codegen -w @smartsense/web` (or `codegen:watch` during active development) to regenerate `src/lib/graphql/__generated__/`.
4. Import the generated `TypedDocumentNode` and pass it to `useQuery`/`useMutation` in the component/hook/service that needs it.

CI does not currently run codegen as a separate step — a stale `__generated__` directory that no longer matches its source `.graphql` documents and the live schema will surface as a TypeScript error during `npm run typecheck`, since the generated types are checked in as regular source files consumed by the rest of the app.

### Rules for Generated Files

- `src/lib/graphql/__generated__/` is a build artifact. Never hand-edit a file inside it — regenerate instead.
- Never hand-write a type, interface, or enum that duplicates a generated one ([coding-standards.md § No Handwritten GraphQL Types](./coding-standards.md#no-handwritten-graphql-types)).
- Commit the generated output to version control (already the case for this project) so a fresh clone type-checks without requiring a live backend to run codegen against first — but treat any diff inside `__generated__` in a PR as a _derived_ change, reviewed by checking the `.graphql` document(s) that produced it, not by reading the generated code line-by-line.

---

## 11. Error Handling

### GraphQL Errors

All GraphQL error formatting is centralized in `GlobalExceptionFilter` (`apps/api/src/common/filters/global-exception.filter.ts`) — no resolver or service constructs a `GraphQLError` directly. A thrown NestJS exception is mapped to an `extensions.code` value:

| Exception thrown                             | `extensions.code`       | Meaning                                                                                                                                     |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `NotFoundException`                          | `NOT_FOUND`             | Requested entity does not exist (or is not visible to this caller).                                                                         |
| `UnauthorizedException` (or a guard failure) | `UNAUTHENTICATED`       | Missing/invalid/expired credentials — see [authentication.md](./authentication.md#graphql-authentication).                                  |
| `ForbiddenException`                         | `FORBIDDEN`             | Valid identity, insufficient role/permission.                                                                                               |
| `BadRequestException`                        | `BAD_USER_INPUT`        | Input failed validation (§ Validation Errors below).                                                                                        |
| `ConflictException`                          | `CONFLICT`              | State conflict — e.g. a unique constraint violation translated from Prisma's `P2002` (`docs/api-conventions.md § Error Handling Strategy`). |
| Anything else / unrecognized                 | `INTERNAL_SERVER_ERROR` | Unexpected failure — logged with full context, returned to the client as a generic message.                                                 |

### Validation Errors

Handled entirely by the global `AppValidationPipe` ([coding-standards.md § Validation](./coding-standards.md#validation)) before a resolver body executes — `whitelist`, `forbidNonWhitelisted`, and `stopAtFirstError` mean a malformed input always fails the same way, as a `BadRequestException` translated to `BAD_USER_INPUT`, never as an inconsistent hand-rolled check inside a resolver.

### Business Errors

A business-rule violation (e.g. "cannot cancel an already-shipped order") is thrown as the most specific applicable NestJS exception from the service layer — typically `BadRequestException` or a dedicated exception if the codebase later introduces one for a specific rule family. It is not represented as a "success" response with an embedded error field in the payload; GraphQL's `errors` array is the single channel for anything that isn't the requested data.

### Network Errors

Handled on the frontend, at the Apollo Link level, for cross-cutting concerns — a network failure or an `UNAUTHENTICATED` GraphQL error should be caught by a shared link (an error link) that can trigger a session-level reaction (e.g. silent refresh, redirect to `/login` per [authentication.md § Route Protection](./authentication.md#route-protection-frontend)) rather than every individual component reimplementing that logic. `apolloClient`'s current `httpLink`-only setup (`apps/web/src/lib/apollo/client.ts`) does not yet include an error link or an auth link — adding them is part of the frontend auth feature work described in [authentication.md § Frontend Auth Feature Responsibilities](./authentication.md#frontend-auth-feature-responsibilities), not a currently implemented behavior.

### Error Response Format

A GraphQL response with an error looks like:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Order not found",
      "extensions": { "code": "NOT_FOUND" }
    }
  ]
}
```

With `errorPolicy: 'all'` (§ 9) on the client, a partial-success response (`data` populated for the fields that succeeded, `errors` populated for the ones that didn't) is also possible and must be handled — do not assume `errors.length > 0` implies `data` is `null`.

---

## 12. Security Considerations

- **Query depth limits.** Not currently enforced. Recommended addition once the schema grows past simple flat queries: a depth-limiting validation rule (e.g. `graphql-depth-limit`) registered on `GraphQLModule`'s `validationRules`, capping nested selections (an `Order` → `Items` → `ProductVariant` → `Product` → `Category` → `parent` chain, for example) to prevent a maliciously or accidentally deep query from causing excessive resolver fan-out.
- **Complexity limits.** Not currently enforced. Recommended alongside depth limiting once list fields with arguments (pagination, § 5) exist — a complexity-scoring rule (e.g. `graphql-query-complexity`) prevents a query that's shallow but requests many expensive, high-fan-out list fields from being cheap to send and expensive to execute.
- **Introspection policy.** Driven by `GRAPHQL_INTROSPECTION` (`apps/api/.env.example`, currently `true`). Introspection must be disabled (`GRAPHQL_INTROSPECTION=false`) in production per the same reasoning as `GRAPHQL_PLAYGROUND=false` in `infrastructure/docker/docker-compose.yml`'s production-facing configuration — a public, introspectable schema hands an attacker a complete map of the API surface for free.
- **Rate limiting.** Not currently implemented at the GraphQL layer. This belongs to a dedicated security/infrastructure document once one exists (referenced here as `docs/security.md`, not yet written) — out of scope for this document beyond flagging it as a gap alongside depth/complexity limits.
- **Authorization responsibilities.** Fully owned by [authentication.md](./authentication.md) — `GqlAuthGuard`, `RolesGuard`, and `PermissionGuard`, registered globally and opt-out via `@Public()` (see [authentication.md § GraphQL Authentication](./authentication.md#graphql-authentication)). This document's only responsibility is ensuring new schema design (new queries/mutations/fields) is built with the assumption that authentication is default-on, per [coding-standards.md § Guards](./coding-standards.md#guards).

---

## 13. Performance Guidelines

### The N+1 Problem

A query like `orders { partner { name } }` naively resolves `partner` once per `Order` in the result set — N orders means N additional database round-trips for a value that could have been fetched in one query. This is the single most common GraphQL-specific performance bug and must be considered whenever a resolver adds a field that traverses a Prisma relation ([database-schema.md § Relationships Explained](./database-schema.md#relationships-explained) lists every relation in the schema — any of them is a candidate for N+1 once exposed as a nested GraphQL field).

### DataLoader Strategy

Not currently implemented (no relation-traversing resolvers exist yet). The standard mitigation, to be adopted the moment a nested-entity field resolver is added: a per-request `DataLoader` instance that batches and caches lookups by ID within a single GraphQL execution.

```ts
// Illustrative pattern — request-scoped DataLoader batching Partner
// lookups so N Orders resolve their `partner` field with one query,
// not N queries.
const partnerLoader = new DataLoader<string, Partner>(async (partnerIds) => {
  const partners = await prisma.partner.findMany({ where: { id: { in: [...partnerIds] } } })
  const byId = new Map(partners.map((p) => [p.id, p]))
  return partnerIds.map((id) => byId.get(id))
})
```

DataLoader instances are created **per request** (typically via a request-scoped provider or the GraphQL context factory), never as a singleton shared across requests — a shared loader would leak batched results and cached values across unrelated users' requests.

### Caching

- **Client-side:** Apollo's normalized cache (§ 9) is the primary caching layer for read data already fetched once in a session.
- **Server-side:** no response/query caching layer exists yet. If added, it applies at the resolver/service level (e.g. caching a genuinely static lookup like `Category` trees) and must respect the same soft-delete/`deletedAt` filtering rules as any other query ([coding-standards.md § Soft Delete Strategy](./coding-standards.md#soft-delete-strategy)) — a cached stale "deleted" row being served as active would be a correctness bug, not just a staleness inconvenience.

### Pagination

Always paginate a list field that can grow unbounded (§ 5) — an unpaginated `orders: [Order!]!` that returns every Order in the system is both a performance and a security-adjacent concern (unbounded response size) as the dataset grows.

### Query Optimization

- Select only the Prisma fields/relations a given resolver invocation actually needs (`select`/`include`) rather than defaulting to fetching every column and relation on every query — the flexibility GraphQL gives clients (§ 5 Field Selection) is wasted if the service layer always over-fetches from Postgres regardless of what was actually requested.
- Prefer a single Prisma query with the necessary `include`s over multiple sequential queries in a resolver/service method, when the relations are known in advance and not conditionally needed.

---

## 14. Versioning & Deprecation

### Schema Evolution

GraphQL schemas evolve additively — this project does not version its GraphQL API (no `/v1/graphql`, `/v2/graphql`). Adding a new field, query, mutation, or enum value is always safe for existing clients. The only breaking changes are: removing a field/type, renaming a field/type, changing a field's type incompatibly, or changing a field from nullable to non-null (or vice versa) in a way that violates an existing client's assumptions.

### `@deprecated` Usage

A field or enum value that must be phased out is marked `@deprecated(reason: "...")` rather than removed immediately:

```graphql
type Order {
  total: Float!
    @deprecated(reason: "Use totalAmount (Decimal-backed) instead. Removed after 2026-Q4.")
  totalAmount: String!
}
```

The `reason` always states the replacement and, where known, a removal timeline. Deprecated fields remain functional (never a silent no-op) until actually removed in a later change.

### Backward Compatibility

- A generated frontend hook (§ 10) continues to compile against a deprecated-but-present field — deprecation is a signal to stop _writing new_ usages, not a forcing function to break existing ones immediately.
- Before actually removing a deprecated field/type, confirm via a codebase search that no `.graphql` document still selects it — GraphQL Code Generator will fail loudly (a missing field on the generated type) if a document still references a field the schema has since dropped, which is the intended safety net.

---

## 15. Best Practices

1. **Schema-first thinking, code-first tooling.** Even though the schema is generated from TypeScript decorators, design the _shape_ of a new type/query/mutation on paper (or in a scratch `.graphql` snippet) before writing the resolver — the schema is the contract; the decorators are just how this project happens to express it.
2. **One barrel of truth per concept.** A domain concept (`Order`) has exactly one `@ObjectType()` definition, owned by its module, reused everywhere it appears in the schema — never a second, slightly different `Order`-shaped type defined elsewhere.
3. **Keep resolvers thin.** A resolver method's body is a call into its service, per [coding-standards.md § Controllers / Resolvers](./coding-standards.md#controllers--resolvers) — this applies identically to GraphQL resolvers.
4. **Design for the client, implement for the database.** A GraphQL field can be shaped however is most natural for the consuming UI even if the underlying Prisma query needs to reshape/aggregate data to produce it — the schema is not obligated to mirror the database schema 1:1.
5. **Always select `id`.** Every fragment/query touching an entity type includes its `id` field, so Apollo's cache normalization (§ 9) works correctly.
6. **Write the fragment before the second usage, not after.** The moment a second operation needs the same field selection, extract the fragment (§ 8) immediately rather than copy-pasting the selection a second time.

---

## 16. Common Anti-Patterns

| Anti-pattern                                                                                | Why it's a problem                                                                                                                         | Instead                                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| A single `data: JSON` scalar field returning an arbitrary blob                              | Defeats GraphQL's entire type-safety and field-selection value proposition                                                                 | Model the actual shape as typed fields/objects, even if it takes more upfront design |
| Multiple positional scalar arguments on a mutation (`updateOrder(id, status, note)`)        | Not additively evolvable; every new field is a breaking signature change for every call site                                               | Single `<Name>Input` object (§ 6)                                                    |
| A resolver calling `PrismaService` directly                                                 | Bypasses the service layer's business logic/validation ([coding-standards.md](./coding-standards.md#controllers--resolvers))               | Resolver delegates to its module's service                                           |
| Returning `{ success: true, error: null }`-style payloads instead of using GraphQL errors   | Reinvents error handling GraphQL already provides, and is inconsistent with `GlobalExceptionFilter`'s centralized mapping (§ 11)           | Throw a typed exception; let the global filter shape the GraphQL error               |
| A nested list field with no pagination on a table that can grow unbounded                   | Unbounded response size; the eventual N+1/performance cliff (§ 13) arrives without warning                                                 | Cursor-based pagination from the start for any inherently unbounded list (§ 5)       |
| A hand-written TypeScript interface mirroring a query's shape instead of the generated type | Silently drifts from the schema the moment either side changes ([coding-standards.md](./coding-standards.md#no-handwritten-graphql-types)) | Import the GraphQL Code Generator output                                             |
| Leaving `GRAPHQL_INTROSPECTION`/`GRAPHQL_PLAYGROUND` enabled in a production environment    | Exposes the full schema and an interactive query console to anyone who can reach the API                                                   | Both `false` in production, environment-driven per environment (§ 12)                |

---

## 17. Future Enhancements

Tracked here as known, intentional gaps — not oversights — so they aren't rediscovered from scratch later:

- **Query depth and complexity limiting** (§ 12) — needed before the schema exposes deeply nested or highly relational queries at scale.
- **DataLoader-based batching** (§ 13) — needed the moment the first relation-traversing field resolver ships.
- **Real pagination, filtering, and sorting** (§ 5) — the concrete `<Type>Connection`/`<Type>FilterInput`/`<Type>SortInput` types for `orders`, `products`, and other list queries, once those modules move past their current placeholder `xStatus` queries.
- **Subscriptions** (§ 3) — for live order/inventory updates, once a concrete real-time requirement is prioritized.
- **A dedicated `Money`/`Decimal` custom scalar** (§ 7) — to carry `database-schema.md`'s `Decimal(12,2)` precision guarantee all the way to the GraphQL layer instead of narrowing to `Float`/`String` implicitly.
- **Apollo error/auth links on the frontend client** (§ 11) — currently tracked as part of the frontend auth feature work in [authentication.md](./authentication.md#frontend-auth-feature-responsibilities), not GraphQL-specific, but the GraphQL client configuration is where it lands.
- **A dedicated `docs/security.md`** covering rate limiting and broader API security posture (§ 12), referenced but not yet written.
