# SmartSense Marketplace — Production Deployment Runbook

Version: 1.0

---

## Purpose

A single, consolidated, ready-to-execute **checklist** for taking a release from a
green build to a running production instance. This document does not re-explain
_how_ each mechanism works — that is owned by
[deployment.md](./deployment.md) — it sequences the steps and marks, unambiguously,
which are already proven here and which require infrastructure this training project
deliberately does not provision.

Two tracks are kept separate on purpose (per
[REMEDIATION_PLAN_v2_TRAINING_PROJECT.txt](../REMEDIATION_PLAN_v2_TRAINING_PROJECT.txt),
item 9): **Engineering Readiness** (everything the codebase and pipeline prove) and
**Real Production Deployment Readiness** (everything categorically unverifiable without
a provisioned, always-on host). Nothing below is a shortfall to apologize for — the
infrastructure-dependent steps are a documented, intentional boundary of a training
project, not an incomplete deliverable.

---

## Section 1 — Proven Today (Local & CI)

These steps are **implemented, exercised, and green** — locally and/or on the
GitHub-hosted CI runner. They are the deployment pipeline, minus a remote host. Each
links to its owning mechanism in [deployment.md](./deployment.md); this list is a
status ledger, not a re-description.

| Step                                                                                                                | Status    | Proven by                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Container images build** (`api`, `web`, monorepo-root context)                                                    | ✅ Proven | [deployment.md § Build Process](./deployment.md#build-process); CD builds + pushes to GHCR ([§ CI/CD Strategy](./deployment.md#cicd-strategy)) |
| **Full Compose stack boots** (db, keycloak-db, keycloak, api, web)                                                  | ✅ Proven | [deployment.md § Docker Strategy](./deployment.md#docker-strategy); Playwright job boots it every CI run                                       |
| **Database migrations apply** (`prisma migrate deploy`)                                                             | ✅ Proven | [deployment.md § Database Deployment](./deployment.md#database-deployment)                                                                     |
| **Reference-data seed** (`prisma:seed`, dev/QA only)                                                                | ✅ Proven | [deployment.md § Seed Strategy](./deployment.md#database-deployment)                                                                           |
| **Health checks** (`/health` DB-backed, container healthchecks)                                                     | ✅ Proven | [deployment.md § Health Checks](./deployment.md#health-checks)                                                                                 |
| **Backup / restore mechanism** (rehearsed, not just documented)                                                     | ✅ Proven | [deployment.md § Backup & Recovery](./deployment.md#backup--recovery) (`scripts/verify-backup-restore.sh`)                                     |
| **Local Production Simulation** (build → migrate → deploy → smoke)                                                  | ✅ Proven | [deployment.md § Supported Environments](./deployment.md#supported-environments) (`scripts/local-prod-sim.sh`)                                 |
| **Clean-clone verification** (fresh checkout → running stack)                                                       | ✅ Proven | `scripts/verify-clean-clone.sh` ([§ Operational Runbooks](./deployment.md#operational-runbooks))                                               |
| **CI gates** (lint, typecheck, unit + integration tests, Playwright E2E, `npm audit --audit-level=critical`, build) | ✅ Proven | [testing.md § CI Testing Pipeline](./testing.md#ci-testing-pipeline); `.github/workflows/ci.yml`                                               |

If any row above regresses, that is a real defect — fix it before considering a real
deployment. Section 2 assumes Section 1 is green.

---

## Section 2 — Real Deployment Steps

Every step in this section is **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE.**
This project runs no VPS, no cloud host, no managed database, no paid monitoring, no
paid domain, and no paid TLS — by deliberate policy
([deployment.md § Purpose, Assumption 1](./deployment.md#purpose)). The steps are
written so that a future operator _with_ infrastructure could execute them directly;
they are documented and deferred, not performed here.

1. **Provision an always-on host** — _UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE._
   A continuously reachable machine to run the Compose stack (or a Kubernetes cluster,
   see [deployment.md § Scaling Strategy](./deployment.md#scaling-strategy)). Load the
   production environment values per
   [deployment.md § Production Values Checklist](./deployment.md#production-values-checklist-sm-148)
   from a real secret store — never the checked-in dev placeholders.

2. **Configure DNS** — _UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE._
   Point the app, API, and Keycloak hostnames at the host / reverse proxy
   ([deployment.md § Deployment Architecture](./deployment.md#deployment-architecture)).

3. **Terminate TLS at a reverse proxy** — _UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE._
   Introduce the reverse proxy that is `future` throughout
   [deployment.md](./deployment.md#infrastructure-components), obtain a certificate
   (e.g. via Let's Encrypt / ACME automation), and enforce HTTPS everywhere. Set
   Keycloak's production posture (`start` not `start-dev`, `sslRequired ≠ none`,
   strict hostname) per [deployment.md § Keycloak Deployment](./deployment.md#keycloak-deployment)
   and lock `CORS_ALLOWED_ORIGINS` to the real origins ([docs/security.md § CORS](./security.md#cors)).

4. **Promote a release via `cd.yml`** — _UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE
   (for the remote leg)._ The build-and-push-to-GHCR leg is proven (Section 1); the
   remaining, unverified leg is pulling those exact tags onto the provisioned host and
   running `prisma migrate deploy` **before** the new version takes traffic
   ([deployment.md § CI/CD Strategy](./deployment.md#cicd-strategy),
   [§ Database Deployment](./deployment.md#database-deployment)). Trigger:
   `git tag vX.Y.Z && git push --tags`.

5. **Run the `/health` smoke test against the deployed instance** — _UNVERIFIED —
   REQUIRES PRODUCTION INFRASTRUCTURE._ Confirm container healthchecks green,
   `curl https://<host>/health` returns 200 (DB-backed indicator, not just process-up),
   and a `{ authStatus }` GraphQL query succeeds
   ([deployment.md § Health Checks](./deployment.md#health-checks)). The _mechanism_ is
   proven locally; running it against a real host is not.

6. **Confirm the rollback path before it is needed** — _UNVERIFIED — REQUIRES
   PRODUCTION INFRASTRUCTURE._ Application rollback = redeploy the previous image tag
   (always possible because migrations are backward-compatible, expand → migrate →
   contract); database rollback = restore from backup, treated as an incident
   ([deployment.md § Release Strategy](./deployment.md#release-strategy),
   [§ Database Deployment § Rollback Considerations](./deployment.md#database-deployment)).
   The previous tag must be known and confirmed re-deployable as part of every deploy.

Adjacent capabilities that are also **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE**
and out of scope for the same reason: external monitoring / alerting / log aggregation
([deployment.md § Monitoring](./deployment.md#monitoring)), scheduled retained backups
([deployment.md § Backup & Recovery](./deployment.md#backup--recovery)), and a genuine
disaster-recovery drill against a real host.

---

## Section 3 — Permanent Status

> **Production-deployable and locally/CI verified, with real production infrastructure
> deployment intentionally not performed because this is a training project.**

This is the correct, permanent status line for the Real Production Deployment Readiness
track — not a temporary placeholder awaiting a future audit. Engineering Readiness is
proven by Section 1; the Section 2 steps are documented and deferred by design. The two
tracks are scored separately and neither is treated as a failure of the other.
