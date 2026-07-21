#!/usr/bin/env bash
# Rehearses a full backup/restore cycle against the `db` service — not just a
# "the scripts exist" check. Per docs/deployment.md's own principle, "a backup
# that has never been restored is a hope, not a backup": this script actually
# destroys the volume between backup and restore, so it cannot pass by
# accident (there is no original data left to fall back on if restore fails).
#
# Usage: scripts/verify-backup-restore.sh

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

PG_DB="smartsense_marketplace"
VOLUME_NAME="${COMPOSE_PROJECT}_postgres_data"
TABLES=(customers products orders)

row_counts() {
  for t in "${TABLES[@]}"; do
    compose exec -T db psql -U postgres -d "$PG_DB" -tAc "SELECT '$t=' || count(*) FROM $t;"
  done
}

log "bringing up db (+ dependencies needed to seed real data)…"
compose up -d --wait db keycloak-db keycloak
run_migrations
log "seeding reference + sample data so there is something real to lose…"
DATABASE_URL="postgresql://postgres:password@localhost:5432/$PG_DB" \
  npm run prisma:seed --workspace=@smartsense/api >/dev/null

log "row counts before backup:"
BEFORE="$(row_counts)"
echo "$BEFORE" | sed 's/^/  /'

scripts/db-backup.sh db
DUMP_FILE="$(ls -t backups/db/*.dump | head -1)"
log "using dump: $DUMP_FILE"

log "destroying the db volume to prove restore works from nothing, not just over existing rows…"
compose rm -sf db
docker volume rm "$VOLUME_NAME"

log "bringing db back up empty…"
compose up -d --wait db

log "restoring…"
scripts/db-restore.sh "$DUMP_FILE" db --force

log "row counts after restore:"
AFTER="$(row_counts)"
echo "$AFTER" | sed 's/^/  /'

if [ "$BEFORE" = "$AFTER" ]; then
  log "PASS — restored row counts match pre-backup row counts exactly."
  exit 0
else
  err "FAIL — row counts differ after restore. Before:"
  echo "$BEFORE" >&2
  err "After:"
  echo "$AFTER" >&2
  exit 1
fi
