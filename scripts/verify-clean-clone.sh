#!/usr/bin/env bash
# Proves the full stack builds and boots from a truly fresh checkout — no
# assumptions about pre-existing local state (node_modules, generated Prisma
# client, running containers). Intended to be run against a clean `git clone`
# of the repository, not the developer's already-warmed working copy.
#
# Usage:
#   scripts/verify-clean-clone.sh                     # build + boot + smoke query
#   scripts/verify-clean-clone.sh --with-backup-restore  # also rehearse backup/restore

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

WITH_BACKUP_RESTORE="false"
if [ "${1:-}" = "--with-backup-restore" ]; then
  WITH_BACKUP_RESTORE="true"
fi

log "npm ci (workspace root)…"
npm ci

log "generating Prisma client…"
npm run prisma:generate --workspace=@smartsense/api

log "running local production simulation (build mode, kept up for smoke-testing)…"
scripts/local-prod-sim.sh --build --keep-up

log "seeding reference data (host-side — needs devDependencies the production image deliberately excludes)…"
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartsense_marketplace" \
  npm run prisma:seed --workspace=@smartsense/api

log "GraphQL smoke query: { authStatus }"
RESPONSE="$(curl -fsS -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ authStatus }"}')"
echo "$RESPONSE"
if ! echo "$RESPONSE" | grep -q '"authStatus"'; then
  err "FAIL — GraphQL smoke query did not return authStatus"
  compose down -v
  exit 1
fi

if [ "$WITH_BACKUP_RESTORE" = "true" ]; then
  log "rehearsing backup/restore…"
  scripts/verify-backup-restore.sh
fi

log "PASS — clean-clone verification succeeded. Tearing down…"
compose down -v
