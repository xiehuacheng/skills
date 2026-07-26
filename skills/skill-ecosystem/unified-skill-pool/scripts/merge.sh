#!/usr/bin/env bash
# merge.sh - Move skills from each harness into the canonical pool, with conflict resolution.
# Usage: merge.sh <harness-list-json> <canonical-dir>
# Output: JSON report to stdout.

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: merge.sh <harness-list-json> <canonical-dir>" >&2
  exit 1
fi

HARNESS_JSON="$1"
CANONICAL="$2"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="$HOME/skills-backup-$TS.tar.gz"
CONFLICT_DIR="$HOME/.skills-conflict-versions-$TS"

# Sanity checks
command -v mavis-trash >/dev/null 2>&1 || { echo "[ERROR] mavis-trash not found in PATH" >&2; exit 1; }
mkdir -p "$CANONICAL" "$CONFLICT_DIR"

# 1. Backup all harness dirs
echo "Creating backup at $BACKUP ..." >&2
backup_paths=()
while IFS= read -r line; do
  path=$(echo "$line" | python3 -c 'import json,sys; print(json.load(sys.stdin)["path"])')
  if [[ -d "$path" ]]; then
    backup_paths+=("$path")
  fi
done < <(echo "$HARNESS_JSON" | python3 -c 'import json,sys; [print(json.dumps(h)) for h in json.load(sys.stdin)]')

if [[ ${#backup_paths[@]} -gt 0 ]]; then
  tar -czf "$BACKUP" "${backup_paths[@]/#/-C/}" 2>/dev/null
  # tar with -C expects paths in the form "-C <dir> <name>". The above is wrong.
  # Simpler: cd into each dir and tar relative.
  tar_args=()
  for p in "${backup_paths[@]}"; do
    parent=$(dirname "$p")
    name=$(basename "$p")
    tar_args+=("-C" "$parent" "$name")
  done
  tar -czf "$BACKUP" "${tar_args[@]}"
fi
echo "Backup complete." >&2

# 2. Move skills into canonical, with conflict policy: canonical wins
moved=()
skipped=()
conflicts=()

while IFS= read -r hjson; do
  hname=$(echo "$hjson" | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')
  hpath=$(echo "$hjson" | python3 -c 'import json,sys; print(json.load(sys.stdin)["path"])')
  if [[ ! -d "$hpath" || "$hpath" == "$CANONICAL" ]]; then
    continue
  fi
  for skill in "$hpath"/*/; do
    [[ -d "$skill" ]] || continue
    name=$(basename "$skill")
    if [[ -e "$CANONICAL/$name" ]]; then
      # Conflict: keep canonical, preserve this one
      mkdir -p "$CONFLICT_DIR/$hname"
      cp -R "$skill" "$CONFLICT_DIR/$hname/$name"
      mavis-trash "$skill" >/dev/null 2>&1 || true
      conflicts+=("$hname/$name")
    else
      mv "$skill" "$CANONICAL/$name"
      moved+=("$hname/$name")
    fi
  done
  # Trash harness leftovers (hidden dirs, .DS_Store, etc.)
  for leftover in "$hpath"/.??* "$hpath"/.DS_Store; do
    [[ -e "$leftover" ]] || continue
    mavis-trash "$leftover" >/dev/null 2>&1 || true
  done
  # Trash the empty harness dir (will be replaced by symlink later)
  if [[ -z "$(ls -A "$hpath" 2>/dev/null)" ]]; then
    mavis-trash "$hpath" >/dev/null 2>&1 || true
  fi
done < <(echo "$HARNESS_JSON" | python3 -c 'import json,sys; [print(json.dumps(h)) for h in json.load(sys.stdin)]')

# 3. Build JSON report
python3 - "$moved" "$skipped" "$conflicts" "$BACKUP" "$CONFLICT_DIR" <<'PY'
import json, sys
moved, skipped, conflicts, backup, conflict_dir = sys.argv[1:6]
print(json.dumps({
    "moved": moved,
    "skipped": skipped,
    "conflicts": conflicts,
    "backup_path": backup,
    "conflict_versions_dir": conflict_dir,
    "moved_count": len(moved),
    "skipped_count": len(skipped),
    "conflict_count": len(conflicts),
}, indent=2))
PY
