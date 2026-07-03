---
description: Update project documentation to match an implemented change (same-PR policy).
argument-hint: <change whose docs need syncing>
---

# /docs

## Purpose

Keep `docs/` synchronized with reality after implementation — the same-PR documentation
policy from `docs/coding-standards.md § 16` and `docs/contributing.md`.

## When to Use

- After any change that alters architecture, schema, conventions, folder structure,
  milestone/task status, or invalidates a stated assumption in any doc.

## Workflow

1. Identify what the change invalidated: search `docs/` for statements about the touched
   area (status headers, "Assumption made explicit" sections, tables, current-state callouts).
2. Locate the **owning** document for each fact (every doc's scope section names what it owns;
   the ownership map is in `docs/contributing.md` and `.claude/context/project.md`).
3. Update facts in their owning doc only; update cross-references, never duplicate content.
4. Reconcile trackers where relevant: `docs/milestones.md` statuses, `docs/TASKS.md`
   task/debt rows, `docs/authorization.md`'s permission catalog for new keys.
5. New conventions established by a first implementation get written into the owning doc.
6. Verify links still resolve and no doc now contradicts another.

## Inputs

$ARGUMENTS — the implemented change (or PR/branch) whose documentation impact to process.

## Outputs

Doc edits scoped to owning documents, ready to ship in the same PR as the code.

## Rules

- Never duplicate: fix a fact once, in its owner; link from elsewhere.
- Preserve each doc's structure and "assumptions made explicit" honesty — date-stamp
  reality, don't erase history.
- When a doc and reality disagree, reality wins and the doc is corrected.
- Doc-only work still uses a `docs/<kebab>` branch and `docs(SM-###):` commits.

## Example

`/docs backend now registers a timing interceptor — update backend-architecture.md and api-conventions.md`
