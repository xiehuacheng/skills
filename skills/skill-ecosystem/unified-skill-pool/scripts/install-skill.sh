#!/usr/bin/env bash
# install-skill.sh - Install a new skill into the canonical pool.
# Usage: install-skill.sh <path-to-skill-dir> [--upstream <owner/repo>]
# Output: JSON to stdout.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: install-skill.sh <path-to-skill-dir> [--upstream <owner/repo>]" >&2
  exit 1
fi

SRC=""
UPSTREAM=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --upstream) UPSTREAM="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: install-skill.sh <path-to-skill-dir> [--upstream <owner/repo>]" >&2
      exit 0
      ;;
    --) shift; break ;;
    -*) echo "Unknown arg: $1" >&2; exit 1 ;;
    *) SRC="$1"; shift ;;
  esac
done

[[ -n "$SRC" ]] || { echo "[ERROR] source path required" >&2; exit 1; }
[[ -d "$SRC" ]] || { echo "[ERROR] source not a directory: $SRC" >&2; exit 1; }

CANONICAL="${HOME}/.agents/skills"

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

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

python3 - "$name" "$DEST" "$HARNESS_JSON" "$NOW" "$UPSTREAM" <<'PY'
import json, os, sys
name, dest, harness_list_json, now, upstream = (
    sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
)
harness_list = json.loads(harness_list_json)
visible = 0
for h in harness_list:
    if os.path.isdir(h["path"]):
        visible += 1

# Update manifest (add new entry; preserve first_seen_* if entry already exists)
manifest_path = os.path.join(os.path.dirname(dest.rstrip("/")) or ".", ".manifest.json")
# dest is like /Users/orange/.agents/skills/<name>; canonical is its dir
canonical = os.path.dirname(dest)
manifest_path = os.path.join(canonical, ".manifest.json")
manifest = {"version": 1, "generated_at": now, "skills": {}}
if os.path.isfile(manifest_path):
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        print(f"[WARN] Could not read {manifest_path}: {e}", file=sys.stderr)
        manifest = {"version": 1, "generated_at": now, "skills": {}}

existing = manifest.get("skills", {}).get(name)
if existing:
    # Preserve first_seen_* and upstream (unless caller passed new --upstream).
    first_seen_harness = existing.get("first_seen_harness", "unknown")
    first_seen_at = existing.get("first_seen_at", now)
    final_upstream = upstream if upstream else existing.get("upstream")
else:
    first_seen_harness = "manual-install"
    first_seen_at = now
    final_upstream = upstream or None

visible_list = sorted(h["name"] for h in harness_list if os.path.isdir(h["path"]))
manifest.setdefault("skills", {})[name] = {
    "name": name,
    "first_seen_harness": first_seen_harness,
    "first_seen_at": first_seen_at,
    "upstream": final_upstream,
    "current_harnesses": visible_list,
}
manifest["generated_at"] = now

tmp_path = manifest_path + ".tmp"
try:
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp_path, manifest_path)
except Exception as e:
    print(f"[WARN] Failed to write {manifest_path}: {e}", file=sys.stderr)

print(json.dumps({
    "skill": name,
    "canonical_path": dest,
    "harness_total": len(harness_list),
    "harness_visible": visible,
    "manifest_updated": True,
}, indent=2))
PY
