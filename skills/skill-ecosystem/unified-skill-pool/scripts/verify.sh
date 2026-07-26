#!/usr/bin/env bash
# verify.sh - Audit symlink health across all known harnesses.
# Usage: verify.sh [--canonical <dir>]
# Output: Human-readable table to stdout; non-zero exit if any broken.

set -euo pipefail

CANONICAL="${HOME}/.agents/skills"

ADDL_HARNESS_JSON="[]"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --canonical) CANONICAL="$2"; shift 2 ;;
    --harness)
      # Ad-hoc harness entry: --harness name:path (e.g. for a custom install
      # location not in the table). May be passed multiple times.
      spec="$2"
      name="${spec%%:*}"
      path="${spec#*:}"
      if [[ -z "$name" || -z "$path" || "$name" == "$spec" ]]; then
        echo "[ERROR] --harness expects name:path" >&2
        exit 1
      fi
      ADDL_HARNESS_JSON=$(python3 -c "
import json, os
existing = json.loads(os.environ.get('ADDL_HARNESS_JSON', '[]'))
existing.append({'name': '$name', 'path': '$path'})
print(json.dumps(existing))
")
      shift 2
      ;;
    -h|--help)
      echo "Usage: verify.sh [--canonical <dir>] [--harness name:path ...]"
      echo "Default canonical: ~/.agents/skills"
      echo ""
      echo "Options:"
      echo "  --canonical <dir>       Override canonical location"
      echo "  --harness name:path     Add an ad-hoc harness (can be repeated)"
      echo "  -h, --help              Show this help"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Export for the python heredoc below.
export ADDL_HARNESS_JSON

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT="$SCRIPT_DIR/detect.sh"

if [[ ! -x "$DETECT" ]]; then
  echo "[ERROR] detect.sh not found or not executable: $DETECT" >&2
  exit 1
fi

# Use detect.sh to enumerate
HARNESS_JSON=$(bash "$DETECT")

# If no ad-hoc harnesses provided, default to empty list.
if [[ -z "${ADDL_HARNESS_JSON:-}" ]]; then
  ADDL_HARNESS_JSON="[]"
fi

# Resolve to absolute path for comparison
CANONICAL_ABS=$(cd "$CANONICAL" 2>/dev/null && pwd || echo "$CANONICAL")

python3 - "$HARNESS_JSON" "$CANONICAL_ABS" "$ADDL_HARNESS_JSON" <<'PY'
import json, os, sys
harness_list = json.loads(sys.argv[1])
canonical = sys.argv[2]
addl_raw = sys.argv[3]
addl_list = json.loads(addl_raw) if addl_raw else []

# Merge ad-hoc harnesses (passed via --harness) into the list.
# Dedupe by path: explicit ad-hoc entries override table entries.
by_path = {h["path"]: h for h in harness_list}
for h in addl_list:
    by_path[h["path"]] = h
merged = list(by_path.values())

canonical_exists = os.path.isdir(canonical)

broken = 0
print(f"Canonical: {canonical}  ({'exists' if canonical_exists else 'MISSING'})")
print()
print("{:<18} {:<16} {:>6}  PATH".format("HARNESS", "STATE", "ITEMS"))
print("-" * 90)

state_counts = {"pooled": 0, "real-dir": 0, "absent": 0, "broken-symlink": 0, "weird": 0}
for h in merged:
    name = h["name"]
    path = h["path"]
    if not os.path.lexists(path):
        state = "absent"
        items = 0
    elif os.path.islink(path):
        target = os.readlink(path)
        target_abs = os.path.normpath(os.path.join(os.path.dirname(path), target)) if not os.path.isabs(target) else target
        if os.path.isdir(target_abs):
            state = "pooled"
            items = sum(1 for _ in os.scandir(target_abs))
        else:
            state = "broken-symlink"
            items = 0
            broken += 1
    elif os.path.isdir(path):
        state = "real-dir"
        items = sum(1 for _ in os.scandir(path))
        broken += 1
    else:
        state = "weird"
        items = 0
        broken += 1
    state_counts[state] = state_counts.get(state, 0) + 1
    # Mark ad-hoc entries with a + in the name column
    label = "{}".format(name) if h in harness_list else "{}+".format(name)
    print("{:<18} {:<16} {:>6}  {}".format(label, state, items, path))

print()
if broken == 0 and canonical_exists:
    print("All {} harness paths healthy. Pooled: {}. Real-dirs: {}. Absent: {}. Broken: {}.".format(
        len(merged), state_counts["pooled"], state_counts["real-dir"],
        state_counts["absent"], state_counts["broken-symlink"]))
    sys.exit(0)
else:
    print("{} issue(s) found. See references/troubleshooting.md for recovery steps.".format(broken))
    sys.exit(1 if broken > 0 else 2)
PY
