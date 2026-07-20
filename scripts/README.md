# scripts/

Local-only operational tooling — no VPS, no paid cloud service. Full
procedures and rationale live in [`docs/deployment.md`](../docs/deployment.md);
this is an index, not a second copy of that document.

| Script | Purpose | Doc anchor |
| --- | --- | --- |
| `lib.sh` | Shared helpers (`compose()`, `wait_for_health()`, `run_migrations()`) — sourced by the scripts below, never run directly. | [Operational Runbooks](../docs/deployment.md#operational-runbooks) |
| `local-prod-sim.sh` | Build or pull images, migrate, deploy, smoke-test — the full pipeline, entirely local. | [CI/CD Strategy](../docs/deployment.md#cicd-strategy) |
| `db-backup.sh` | `pg_dump` a running `db`/`keycloak-db` service to `backups/`. | [Backup & Recovery](../docs/deployment.md#backup--recovery) |
| `db-restore.sh` | `pg_restore` a dump back into a running service (destructive; requires `--force`). | [Backup & Recovery](../docs/deployment.md#backup--recovery) |
| `verify-backup-restore.sh` | Rehearses backup/restore end to end, including destroying the volume in between. | [Backup & Recovery](../docs/deployment.md#backup--recovery) |
| `verify-clean-clone.sh` | Proves the full stack builds and boots from a fresh checkout. | [Operational Runbooks](../docs/deployment.md#operational-runbooks) |

All scripts assume the repository root as the working directory and require
Docker + Docker Compose v2 (`--wait` support) locally.
