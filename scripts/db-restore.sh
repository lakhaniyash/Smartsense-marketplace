#!/usr/bin/env bash
# Restores a custom-format pg_dump file (produced by scripts/db-backup.sh)
# into a running Compose Postgres service (`db` or `keycloak-db`).
#
# Destructive by design (`pg_restore --clean` drops existing objects before
# recreating them) — refuses to run without --force or CONFIRM=yes.
#
# Usage: scripts/db-restore.sh <dump-file> <db|keycloak-db> [--force]

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

DUMP_FILE="${1:?usage: scripts/db-restore.sh <dump-file> <db|keycloak-db> [--force]}"
SERVICE="${2:?usage: scripts/db-restore.sh <dump-file> <db|keycloak-db> [--force]}"
FORCE_FLAG="${3:-}"

case "$SERVICE" in
  db) PG_USER="postgres"; PG_DB="smartsense_marketplace" ;;
  keycloak-db) PG_USER="keycloak"; PG_DB="keycloak" ;;
  *) err "unknown service '$SERVICE' — must be 'db' or 'keycloak-db'"; exit 2 ;;
esac

if [ ! -f "$DUMP_FILE" ]; then
  err "dump file not found: $DUMP_FILE"
  exit 1
fi

if [ "$FORCE_FLAG" != "--force" ] && [ "${CONFIRM:-}" != "yes" ]; then
  err "this OVERWRITES '$SERVICE' ($PG_DB) with the contents of $DUMP_FILE."
  err "re-run with --force, or CONFIRM=yes scripts/db-restore.sh $DUMP_FILE $SERVICE"
  exit 1
fi

CONTAINER_ID="$(compose ps -q "$SERVICE")"
if [ -z "$CONTAINER_ID" ] || [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_ID" 2>/dev/null)" != "true" ]; then
  err "'$SERVICE' is not running — start it first (docker compose -p smartsense -f infrastructure/docker/docker-compose.yml up -d $SERVICE)"
  exit 1
fi

log "restoring $DUMP_FILE -> '$SERVICE' ($PG_DB)…"
# --clean --if-exists: drop existing objects before recreating, without
# erroring on a target that's currently empty (a freshly (re)initialized
# volume has no objects to drop, which --if-exists tolerates).
# --no-owner: the dump's original role may not exist in the target instance.
# -T on `exec`: no pseudo-TTY, required for piping a binary custom-format
# dump through stdin.
compose exec -T "$SERVICE" pg_restore --clean --if-exists --no-owner -U "$PG_USER" -d "$PG_DB" < "$DUMP_FILE"

log "done — '$SERVICE' ($PG_DB) restored from $DUMP_FILE"
