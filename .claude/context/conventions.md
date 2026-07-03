# Conventions Context — SmartSense Marketplace

Owner: [docs/coding-standards.md](../../docs/coding-standards.md) (normative, incl. the full
naming table § 8, review checklist § 14, Definition of Done § 16).

## Naming Conventions

| Item                        | Convention                                                                 | Example                 |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------- |
| Components                  | `PascalCase.tsx`                                                           | `ProductCard.tsx`       |
| Hooks                       | `use` + `camelCase.ts`                                                     | `useOrderFilters.ts`    |
| Services                    | `<name>.service.ts`                                                        | `auth.service.ts`       |
| NestJS files                | `<name>.module/.resolver/.guard.ts`                                        | `orders.resolver.ts`    |
| DTOs                        | `<name>.input.ts` / `<name>.output.ts`                                     | `create-order.input.ts` |
| GraphQL docs                | `camelCase.graphql`, one operation per file                                | `getOrders.graphql`     |
| Tests                       | co-located `<subject>.spec.ts`                                             | `roles.guard.spec.ts`   |
| Folders                     | `kebab-case`                                                               | `order-timeline/`       |
| Constants                   | `SCREAMING_SNAKE_CASE`; booleans predicate-shaped (`isLoading`, `canEdit`) |                         |
| GraphQL queries / mutations | noun / `verbNoun` present tense, `camelCase`                               | `orders`, `createOrder` |
| Fragments                   | `PascalCase`, type-prefixed                                                | `OrderSummaryFields`    |

## Folder Conventions

Placement is owned by [docs/folder-structure.md](../../docs/folder-structure.md): fixed feature
anatomy, one barrel per feature/shared subfolder, imports via aliases (`@features/*`, `@shared/*`,
`@app/*`, `@lib/*`; api `@/*`), import groups ordered external → workspace → alias → relative.

## Coding Standards (highlights)

- Strict TS, no `any`, no `!` assertions, no unexplained `@ts-ignore`; `unknown` + narrowing.
- Functional components < 250 lines; named exports; `handle<Event>` handlers → `on<Event>` props.
- Memoize only on measured need; RHF owns form state; escalate state local → Context → Apollo.
- Prisma: explicit `onDelete`/`onUpdate`, `@@map` naming, `deletedAt: null` filters,
  `$transaction` for atomic writes, indexes only for named query patterns.
- Errors: throw typed NestJS exceptions; translate known Prisma codes (`P2002`→Conflict,
  `P2025`→NotFound, `P2003`→BadRequest); never swallow, never log-and-rethrow unchanged.
- Logging via injected `LoggingService` / shared web util; never secrets or tokens.
- Comments explain _why_ only; `TODO(SM-###):` with a ticket or don't merge it.

## Commit Conventions (commitlint-enforced)

- Conventional Commits; type ∈ `feat fix docs style refactor perf test chore ci revert build`.
- Mandatory Jira key: `feat(SM-235): ...` or `Jira: SM-235` footer.
- Header ≤ 100 chars; **every body line < 100 chars** — short single-idea bullets.

## Branch Conventions

- Branch from `development` (not `main`): `<type>/<kebab-description>` (e.g. `feat/catalog-crud`).
- One logical change per branch/PR; merge commits (no squash); hotfixes branch from `main`
  and back-merge into `development`. See [docs/git-workflow.md](../../docs/git-workflow.md).

## Testing Conventions

- Lowest layer that proves the behavior; critical paths tested in the same PR.
- Unit: services instantiated with `new` + mocked Prisma; guards with fake `ExecutionContext`.
- Integration: real `AppModule` + real Postgres + mocked JWKS (never a bypassed guard).
- No snapshots for component output; every bug fix gets a regression test.
  See [docs/testing.md](../../docs/testing.md).

## Documentation Conventions

- Docs update in the same PR as invalidating code; respect each doc's ownership/scope section;
  link instead of restating; state assumptions explicitly and date-stamp reality.
  See [docs/contributing.md](../../docs/contributing.md#documentation-expectations).
