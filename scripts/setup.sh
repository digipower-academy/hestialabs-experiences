#!/usr/bin/env bash
# One-command setup. Safe to re-run.
#   scripts/setup.sh          packages + data-experience (enough for `scripts/test.sh`)
#   scripts/setup.sh --site   also dc-dashboard, the data-experience library and the Nuxt site
#   scripts/setup.sh --all    also the bubble server, if checked out next to this repo
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUBBLE_SERVER_DIR="$ROOT_DIR/../hestialabs-bubble-server"
SITE=false
BUBBLE=false
for arg in "$@"; do
  case "$arg" in
    --site) SITE=true ;;
    --all) SITE=true; BUBBLE=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

step() { echo; echo "==> $*"; }
npm_ci() { npm ci --no-audit --no-fund --loglevel=error; }

required_major="$(cat "$ROOT_DIR/.nvmrc")"
if [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$required_major" ]]; then
  echo "Node $required_major or later is required (found $(node -v)); run 'nvm install && nvm use'." >&2
  exit 1
fi

step "packages: install and build"
cd "$ROOT_DIR/packages" && npm_ci && npx webpack --mode=production --stats=errors-warnings

step "data-experience: install"
cd "$ROOT_DIR/data-experience" && npm_ci

if $SITE; then
  step "dc-dashboard: install and build"
  cd "$ROOT_DIR/dc-dashboard" && npm_ci && npm run build --silent
  step "data-experience: build library"
  cd "$ROOT_DIR/data-experience" && npm run build --silent
  step "experiences: install (links the experiences listed in config/${CONFIG_NAME:-dev}.json)"
  cd "$ROOT_DIR/experiences" && npm_ci
fi

if $BUBBLE; then
  if [[ -d "$BUBBLE_SERVER_DIR" ]]; then
    step "bubble server: poetry install"
    cd "$BUBBLE_SERVER_DIR" && poetry install --no-root
  else
    echo "Bubble server not found at $BUBBLE_SERVER_DIR; skipping" >&2
  fi
fi

echo; echo "Setup complete."
