#!/usr/bin/env bash
# install-skill.sh - Install a new skill into the canonical pool.
# Usage: install-skill.sh <path-to-skill-dir>
# Output: JSON to stdout.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: install-skill.sh <path-to-skill-dir>" >&2
  exit 1
fi

SRC="$1"
CANONICAL="${HOME}/.agents/skills"

[[ -d "$SRC" ]] || { echo "[ERROR] source not a directory: $SRC" >&2; exit 1; }

name=$(basename "$SRC")
DEST="$CANONICAL/$name"

# Validate: skill dir should contain SKILL.md
if [[ ! -f "$SRC/SKILL.md" ]]; then
  echo "[WARN] $SRC does not contain SKILL.md. Installing anyway." >&2
fi

# Refuse to overwrite unless --force
if [[ -e "$DEST" && "${FORCE:-0}" != "1" ]]; then
  echo "[ERROR] $DEST already exists. Use FORCE=1 to overwrite." >&2
  exit 1
fi

cp -R "$SRC" "$DEST"
echo "Installed $name to $DEST" >&2

# Count how many harnesses can see it now
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT="$SCRIPT_DIR/detect.sh"
HARNESS_JSON=$(bash "$DETECT")

python3 - "$name" "$DEST" "$HARNESS_JSON" <<'PY'
import json, os, sys
name, dest, harness_list_json = sys.argv[1], sys.argv[2], sys.argv[3]
harness_list = json.loads(harness_list_json)
visible = 0
for h in harness_list:
    if os.path.isdir(h["path"]):
        visible += 1
print(json.dumps({
    "skill": name,
    "canonical_path": dest,
    "harness_total": len(harness_list),
    "harness_visible": visible,
}, indent=2))
PY
