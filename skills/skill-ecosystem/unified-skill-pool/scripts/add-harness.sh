#!/usr/bin/env bash
# add-harness.sh - Add a single new harness to the pool.
# Usage: add-harness.sh <harness-name> <harness-path> <canonical-dir>
# Output: JSON to stdout.

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: add-harness.sh <harness-name> <harness-path> <canonical-dir>" >&2
  exit 1
fi

NAME="$1"
PATH_="$2"
CANONICAL="$3"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYMLINK="$SCRIPT_DIR/symlink.sh"

[[ -x "$SYMLINK" ]] || { echo "[ERROR] symlink.sh not found or not executable" >&2; exit 1; }

# Run symlink.sh in single-harness mode
result=$(bash "$SYMLINK" "$NAME" "$PATH_" "$CANONICAL")
echo "$result"
