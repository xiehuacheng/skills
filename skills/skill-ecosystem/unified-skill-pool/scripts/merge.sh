#!/usr/bin/env bash
# merge.sh - Move skills from each harness into the canonical pool, with conflict resolution.
#
# Usage: merge.sh <harness-list-json> <canonical-dir> [--apply]
#
# DEFAULT = dry-run. Prints what would happen (moves, conflicts, trashes) as JSON,
# creates no backup, performs no actions. Safe to invoke any time.
#
# --apply = actually execute. Creates the backup tarball first, then moves skills
# into canonical with the conflict policy (canonical-version-wins).
#
# Output: JSON report to stdout (always). The report's "dry_run" field is true or false.
#
# Exit codes:
#   0  success (including dry-run completion)
#   1  invalid arguments or missing mavis-trash

set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: merge.sh <harness-list-json> <canonical-dir> [--apply]" >&2
  echo "  default is dry-run; pass --apply to actually execute" >&2
  exit 1
fi

HARNESS_JSON="$1"
CANONICAL="$2"
APPLY=0
if [[ "${3:-}" == "--apply" ]]; then
  APPLY=1
fi

TS=$(date +%Y%m%d-%H%M%S)
BACKUP="$HOME/skills-backup-$TS.tar.gz"
CONFLICT_DIR="$HOME/.skills-conflict-versions-$TS"

# Sanity checks
command -v mavis-trash >/dev/null 2>&1 || { echo "[ERROR] mavis-trash not found in PATH" >&2; exit 1; }
if [[ $APPLY -eq 1 ]]; then
  mkdir -p "$CANONICAL" "$CONFLICT_DIR"
fi

# Compute the planned moves and conflicts (used in both dry-run and apply)
planned_moved=()
planned_conflicts=()

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
      planned_conflicts+=("$hname/$name")
    else
      planned_moved+=("$hname/$name")
    fi
  done
done < <(echo "$HARNESS_JSON" | python3 -c 'import json,sys; [print(json.dumps(h)) for h in json.load(sys.stdin)]')

# Compute the planned backup paths (harness dirs that actually exist)
backup_paths=()
while IFS= read -r line; do
  path=$(echo "$line" | python3 -c 'import json,sys; print(json.load(sys.stdin)["path"])')
  if [[ -d "$path" ]]; then
    backup_paths+=("$path")
  fi
done < <(echo "$HARNESS_JSON" | python3 -c 'import json,sys; [print(json.dumps(h)) for h in json.load(sys.stdin)]')

# ----- DRY RUN -----
if [[ $APPLY -eq 0 ]]; then
  echo "DRY RUN — no changes will be made. Re-run with --apply to execute." >&2
  # Pass arrays as newline-joined strings (skill names can contain '/' but not '\n')
  moved_str=$(IFS=$'\n'; echo "${planned_moved[*]:-}")
  conflicts_str=$(IFS=$'\n'; echo "${planned_conflicts[*]:-}")
  python3 - "$moved_str" "$conflicts_str" "$BACKUP" "$CONFLICT_DIR" "${backup_paths[@]}" <<'PY'
import json, sys
moved_str, conflicts_str, backup, conflict_dir, *backup_paths = sys.argv[1:]
moved = [m for m in moved_str.split('\n') if m]
conflicts = [c for c in conflicts_str.split('\n') if c]
print(json.dumps({
    "dry_run": True,
    "would_move": moved,
    "would_conflict": conflicts,
    "would_backup_paths": list(backup_paths),
    "would_create_backup": backup,
    "would_create_conflict_dir": conflict_dir,
    "would_move_count": len(moved),
    "would_conflict_count": len(conflicts),
}, indent=2))
PY
  exit 0
fi

# ----- APPLY -----
echo "Applying merge (backup will be at $BACKUP)..." >&2

# 1. Backup all harness dirs
if [[ ${#backup_paths[@]} -gt 0 ]]; then
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
    "dry_run": False,
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
