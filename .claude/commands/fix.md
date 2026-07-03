---
description: Diagnose a bug to root cause and apply the minimal safe fix + regression test.
argument-hint: <bug description or error output>
---

# /fix

## Purpose

Resolve a defect by finding its root cause and applying the smallest safe fix — never
symptom-patching.

## When to Use

- A reported bug, failing test, boot failure, or unexpected runtime behavior.

## Workflow

1. **Analyze** — reproduce from a known state (role, page/operation, input); collect the
   actual error (logs, GraphQL error code, stack). Check `docs/developer-setup.md` and
   `docs/deployment.md` Troubleshooting tables first — many failures are known
   (Prisma client not generated, Joi env validation, Keycloak URL inside vs. outside Docker,
   Docker build context TD-1).
2. **Root cause** — trace through the layer chain (guard → pipe → resolver → service → Prisma)
   rather than stopping at the first plausible suspect; verify the hypothesis before fixing.
3. **Assess impact** — which roles/modules/data are affected; is it security- or
   ledger-relevant (then treat as Critical per `docs/testing.md § Bug Reporting`)?
4. **Fix minimally** — smallest change that removes the cause; follow the layer's conventions;
   no opportunistic refactoring.
5. **Regression test** — reproduce the original failure in a test that fails without the fix
   (`docs/testing.md § Regression Testing`), then verify the whole suite is green and the
   flow works when actually run.

## Inputs

$ARGUMENTS — bug description, error output, or failing test; Jira key if filed.

## Outputs

Root-cause explanation, the minimal fix, a regression test, verification evidence, and any
doc corrections the investigation revealed.

## Rules

- Never fix what you haven't reproduced or can't explain.
- Never silence the signal (`.skip`, `--no-verify`, broadened `catch`) instead of fixing it.
- Security-relevant findings are flagged, not filed as ordinary bugs
  (`docs/security.md § Incident Response`).

## Example

`/fix authenticated requests return UNAUTHENTICATED after docker compose up`
