#!/usr/bin/env bash
# Run the same checks as CI (.github/workflows/ci.yml). Needs `scripts/setup.sh` first.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
step() { echo; echo "==> $*"; }

step "packages: build + validate experience configs"
cd "$ROOT_DIR/packages" && npm test --silent
step "packages: lint"
npm run lint:all --silent

step "data-experience: lint"
cd "$ROOT_DIR/data-experience" && npx vue-cli-service lint --no-fix
step "data-experience: unit tests"
npm test --silent

if [[ -d "$ROOT_DIR/experiences/node_modules" ]]; then
  step "experiences: lint"
  cd "$ROOT_DIR/experiences" && npm run lint --silent
else
  echo "Skipping experiences lint (run scripts/setup.sh --site, or npm ci --ignore-scripts in experiences)"
fi

step "viewer JSON sync"
bash "$ROOT_DIR/scripts/check-viewer-sync.sh"

echo; echo "All checks passed."
