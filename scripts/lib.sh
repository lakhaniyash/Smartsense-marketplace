#!/usr/bin/env bash
# Shared helpers for scripts/*.sh. Sourced, never executed directly.
#
# Every script in this directory pins the Compose project name explicitly
# (`-p smartsense`) rather than letting Compose derive it from the checkout
# directory name. Compose's default project name is a sanitized form of the
# current directory (e.g. `Smartsense-marketplace` -> `smartsense-marketplace`,
# giving a network named `smartsense-marketplace_default`) — a script that
# hardcodes a network/project name assuming a particular checkout directory
# name is not reproducible from a clean clone into an arbitrarily named
# directory. Pinning `-p smartsense` makes every script's target project name
# constant regardless of what the clone directory happens to be called.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infrastructure/docker/docker-compose.yml"
COMPOSE_PROJECT="smartsense"

log() { printf '\033[1;34m[lib]\033[0m %s\n' "$*" >&2; }
err() { printf '\033[1;31m[lib]\033[0m %s\n' "$*" >&2; }

# Wrapper so every script targets the same pinned project + compose file
# without repeating the flags at every call site.
compose() {
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" "$@"
}

# Polls a URL until it returns success, matching the retry budget already
# used by the CD pipeline's original post-deploy smoke test (15 attempts,
# 4s apart = 60s) — kept here as the one place that number is defined.
wait_for_health() {
  local url="$1"
  local attempts="${2:-15}"
  local interval="${3:-4}"
  for i in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "healthy: $url (attempt $i/$attempts)"
      return 0
    fi
    log "waiting for $url ($i/$attempts)…"
    sleep "$interval"
  done
  err "never became healthy: $url"
  return 1
}

# Applies pending Prisma migrations via a throwaway container on the pinned
# project's network — never from inside a serving container, and never by
# running `prisma migrate dev` (which may create new migrations) against a
# deployed-shaped database. Mirrors the pattern already used in
# .github/workflows/cd.yml, extracted here so it has exactly one definition.
#
# DATABASE_URL below targets the `db` service by its Compose service name
# (resolvable only from inside the pinned network) using the same
# dev-placeholder credentials already checked into docker-compose.yml's `api`
# service — there is no separate secret store in a local-only simulation.
run_migrations() {
  local network="${COMPOSE_PROJECT}_default"
  local database_url="postgresql://postgres:password@db:5432/smartsense_marketplace"
  log "applying migrations via throwaway container on network '$network'…"
  docker run --rm --network "$network" \
    -e "DATABASE_URL=$database_url" \
    -v "$REPO_ROOT/database:/database" \
    node:22-alpine \
    sh -lc "npx --yes prisma@6 migrate deploy --schema /database/prisma/schema.prisma"
}
