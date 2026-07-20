#!/usr/bin/env bash
# Local Production Simulation.
#
# Proves the same build -> migrate -> deploy -> smoke-test sequence a real
# deployment would run, entirely on a local machine or an ephemeral CI
# runner — no remote host, no SSH, no VPS. Replaces the old cd.yml VPS deploy
# stub: same migrate-before-deploy ordering, same /health smoke test, but
# targets a Compose stack on this machine instead of a host over SSH.
#
# Usage:
#   scripts/local-prod-sim.sh --build              # build images from source (default)
#   scripts/local-prod-sim.sh --pull <version>      # pull published GHCR tags
#   scripts/local-prod-sim.sh --build --keep-up     # leave the stack running after a pass
#
# --pull expects IMAGE_API_REPO / IMAGE_WEB_REPO env vars naming the GHCR
# repositories (e.g. ghcr.io/lakhaniyash/smartsense-marketplace/api) — the
# version argument is appended as the tag. Falls back to the versions used by
# .github/workflows/cd.yml if unset, so this also works unmodified when
# invoked from that workflow.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

MODE="build"
VERSION=""
KEEP_UP="false"

while [ $# -gt 0 ]; do
  case "$1" in
    --build) MODE="build"; shift ;;
    --pull)
      MODE="pull"
      VERSION="${2:?--pull requires a version argument, e.g. --pull v1.0.0}"
      shift 2
      ;;
    --keep-up) KEEP_UP="true"; shift ;;
    *) err "unknown argument: $1"; exit 2 ;;
  esac
done

DUMP_LOGS_AND_EXIT() {
  err "local production simulation FAILED — dumping compose logs:"
  compose logs --no-color || true
  if [ "$KEEP_UP" != "true" ]; then
    compose down -v || true
  fi
  exit 1
}
trap DUMP_LOGS_AND_EXIT ERR

if [ "$MODE" = "pull" ]; then
  IMAGE_API_REPO="${IMAGE_API_REPO:-ghcr.io/lakhaniyash/smartsense-marketplace/api}"
  IMAGE_WEB_REPO="${IMAGE_WEB_REPO:-ghcr.io/lakhaniyash/smartsense-marketplace/web}"
  export API_IMAGE="${IMAGE_API_REPO}:${VERSION}"
  export WEB_IMAGE="${IMAGE_WEB_REPO}:${VERSION}"
  log "pull mode — API_IMAGE=$API_IMAGE WEB_IMAGE=$WEB_IMAGE"
  compose pull api web
else
  log "build mode — building images from source (context: monorepo root)"
  compose build api web
fi

log "starting db, keycloak-db, keycloak (waiting for healthy)…"
compose up -d --wait db keycloak-db keycloak

run_migrations

log "starting api, web (waiting for healthy)…"
compose up -d --wait api web

log "post-deploy smoke test: GET /health"
wait_for_health "http://localhost:3000/health"

log "PASS — local production simulation succeeded."

if [ "$KEEP_UP" = "true" ]; then
  log "--keep-up set: stack left running. Tear down later with:"
  log "  docker compose -p smartsense -f infrastructure/docker/docker-compose.yml down -v"
else
  log "tearing down…"
  compose down -v
fi
