---
description: Work on the GraphQL layer only — schema, resolvers, operations, fragments, codegen.
argument-hint: <GraphQL task>
---

# /graphql

## Purpose

Design or change the GraphQL layer — schema types, resolvers, queries, mutations, fragments,
and the codegen pipeline — per [docs/graphql.md](../../docs/graphql.md).

## When to Use

- Adding/changing operations, types, DTOs, fragments, or `.graphql` documents.
- Codegen configuration or stale-generated-types issues.

## Workflow

1. Read `docs/graphql.md` (naming § 4, queries § 5, mutations § 6, fragments § 8, codegen § 10,
   errors § 11) and `docs/api-conventions.md` (pagination, filtering, validation split).
2. Design the schema shape first (schema-first thinking, code-first tooling) — sketch the SDL
   before touching decorators.
3. Backend: `@ObjectType`/`@InputType` DTOs under the module's `dto/`; thin resolver delegating
   to the service; `@Permissions()` declared next to the operation; restart the dev server to
   regenerate `schema.gql`.
4. Frontend: one operation per `.graphql` document under the owning feature's `graphql/`;
   fragments on the second shared selection; always select `id`;
   run `npm run codegen -w @smartsense/web`.
5. Verify: schema diff is additive; typecheck is green (stale documents surface as TS errors).

## Inputs

$ARGUMENTS — the operation/type/fragment work to do.

## Outputs

Schema/DTO/resolver changes, `.graphql` documents, regenerated artifacts, and the reviewed
`schema.gql` diff.

## Rules

- **Never touch UI components** — this command ends at generated hooks/types.
- Queries are nouns; mutations are `verbNoun` present tense with a single `Input` object.
- Errors via thrown typed exceptions — never `{ success, error }` payloads.
- Unbounded lists get cursor pagination from the first version.
- Never hand-edit `schema.gql` or `__generated__/`; never hand-write schema-mirroring types.
- Breaking changes require the `@deprecated` cycle (`docs/graphql.md § 14`).

## Example

`/graphql add orders connection query with OrderFilterInput and cursor pagination`
