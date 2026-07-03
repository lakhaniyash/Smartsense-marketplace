---
description: Implement a scoped change following the project's documented conventions.
argument-hint: <task or plan step to implement>
---

# /implement

## Purpose

Produce production-quality code for a defined scope, following the documented architecture
and coding standards exactly.

## When to Use

- Executing a step from an approved `/plan` or `/create-feature` output.
- Any scoped coding task with clear acceptance criteria (a `Ready` task per `docs/TASKS.md`).

## Workflow

1. Read the owning docs for the touched layers first (`docs/coding-standards.md` always;
   plus `docs/api-conventions.md`, `docs/frontend-architecture.md`, `docs/ui-guidelines.md`,
   `docs/graphql.md`, `docs/database-schema.md` as applicable).
2. Locate the established pattern (the `auth` module and existing specs are the reference)
   and copy it — do not invent a parallel convention.
3. Implement the requested scope only, respecting dependency rules
   (`.claude/context/architecture.md`).
4. Add/adjust tests at the lowest proving layer; critical paths get tests in the same change.
5. Run `npm run lint && npm run typecheck && npm run test`; verify by running the code
   ("compiles" ≠ "works").
6. List which docs the change invalidates (for the same-PR update).

## Inputs

$ARGUMENTS — the task, its Jira key, and (if available) the relevant plan step.

## Outputs

Code changes + tests, a verification note (what was actually run), and a list of doc updates
needed.

## Rules

- Generate only the requested scope; no unrelated drive-by changes.
- Strict TS, no `any`, generated GraphQL types only, named exports, Tailwind only.
- New resolvers are protected by default; `@Public()` requires a justifying comment.
- Suggest tests even when not asked; never claim untested code works.

## Example

`/implement SM-252 add CatalogService.createProduct with SKU-uniqueness check`
