#!/bin/bash
# Install dependencies in Claude Code cloud sessions so tests and linters work.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
bash scripts/setup.sh
