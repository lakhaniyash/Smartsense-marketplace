#!/usr/bin/env bash
# Backs up a running Postgres service (`db` or `keycloak-db`) from the local
# Compose stack to a timestamped custom-format pg_dump file under backups/
# (gitignored — dumps are local artifacts, never committed).
#
# Usage: scripts/db-backup.sh <db|keycloak-db>

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

SERVICE="${1:?usage: scripts/db-backup.sh <db|keycloak-db>}"

case "$SERVICE" in
  db) PG_USER="postgres"; PG_DB="smartsense_marketplace" ;;
  keycloak-db) PG_USER="keycloak"; PG_DB="keycloak" ;;
  *) err "unknown service '$SERVICE' — must be 'db' or 'keycloak-db'"; exit 2 ;;
esac

CONTAINER_ID="$(compose ps -q "$SERVICE")"
if [ -z "$CONTAINER_ID" ] || [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_ID" 2>/dev/null)" != "true" ]; then
  err "'$SERVICE' is not running — start the stack first (docker compose -p smartsense -f infrastructure/docker/docker-compose.yml up -d $SERVICE)"
  exit 1
fi

OUT_DIR="backups/$SERVICE"
mkdir -p "$OUT_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$OUT_DIR/${PG_DB}_${TIMESTAMP}.dump"

log "backing up '$SERVICE' ($PG_DB) -> $OUT_FILE"
# -F c: custom format — compressed, and (unlike plain SQL) restorable with
# `pg_restore --clean` over an existing schema AND into a completely empty
# database (it carries full DDL), so one format serves both restore cases.
compose exec -T "$SERVICE" pg_dump -U "$PG_USER" -F c -d "$PG_DB" > "$OUT_FILE"

SIZE="$(du -h "$OUT_FILE" | cut -f1)"
log "done — $OUT_FILE ($SIZE)"
