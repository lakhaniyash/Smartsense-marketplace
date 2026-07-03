---
description: Scope a new feature module end to end and produce a plan — implementation waits for confirmation.
argument-hint: <feature name and goal>
---

# /create-feature

## Purpose

Prepare a complete, documentation-grounded plan for a new feature module (frontend feature +
backend module + schema slice) before any code is written.

## When to Use

- Starting a new vertical slice (a `features/<name>` + `modules/<name>` pair), e.g. the
  M11–M17 modules or a future one (`notifications`, `settings`, `reports`).

## Workflow (in order — do not skip)

1. **Read requirements** — `docs/requirements.md` (module scope, roles) and
   `docs/domain-model.md` (entities, lifecycles, business rules the feature touches).
2. **Read architecture** — `docs/architecture.md`, `docs/frontend-architecture.md`,
   `docs/backend-architecture.md` (layering, bootstrap, module graph).
3. **Read folder structure** — `docs/folder-structure.md` (feature/module anatomy, barrels,
   import rules; every feature ships its full anatomy from day one).
4. **Read GraphQL** — `docs/graphql.md` + `docs/api-conventions.md` (naming, Input/Payload
   patterns, pagination/filter/sort shapes, codegen workflow).
5. **Read coding standards** — `docs/coding-standards.md` (plus `docs/ui-guidelines.md` for UI).
6. **Read authorization** — `docs/authorization.md` (permission keys, ownership scoping;
   new keys need a seed/migration and a doc update in the same PR).
7. **Produce the implementation plan** — vertical slices ordered schema → API → codegen →
   UI → tests, with per-slice complexity, risks, permission/ownership mapping, and the docs
   to update.
8. **Wait for confirmation** — present the plan and stop.

## Inputs

$ARGUMENTS — feature name, goal, and Jira epic if known.

## Outputs

A feature plan (module boundaries, entities/operations, permission mapping, slice sequence,
test strategy, doc impact). **No code.**

## Rules

- **Do NOT implement immediately** — implementation starts only after explicit approval,
  then proceeds via `/implement` per slice.
- New features follow the exact existing anatomy; no parallel conventions.
- Unresolved open questions (domain-model/authentication) are listed as blockers.

## Example

`/create-feature notifications — in-app notification center per M16`
