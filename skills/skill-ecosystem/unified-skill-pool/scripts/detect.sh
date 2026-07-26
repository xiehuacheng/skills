#!/usr/bin/env bash
# detect.sh - Enumerate installed coding-agent harnesses and their skill directories.
# Usage: detect.sh [--name <harness-name>] [--json]
# Output: JSON to stdout.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATHS_FILE="$SCRIPT_DIR/../references/harness-paths.md"

# Source of truth for harness paths is the references doc; we re-derive a
# simple table here. If you add a harness, also update references/harness-paths.md.
# Format: harness_name|path|notes
#
# This list is currently scoped to the harnesses the author has installed.
# Add new entries when (and only when) the user actually installs that harness
# - the table is meant to track real installs, not aspirational future ones.
KNOWN_HARNESSES=(
  "claude-code|$HOME/.claude/skills|Anthropic Claude Code"
  "codex|$HOME/.codex/skills|OpenAI Codex CLI"
  "kimi-code|$HOME/.kimi-code/skills|Moonshot Kimi Code CLI; also reads ~/.agents/skills/ natively"
  "opencode|$HOME/.config/opencode/skills|opencode CLI"
  "oh-my-pi|$HOME/.omp/skills|oh-my-pi (omp) coding agent"
  "minimax-mavis|$HOME/.minimax/agents/mavis/skills|MiniMax agent: mavis"
  "minimax-coder|$HOME/.minimax/agents/coder/skills|MiniMax agent: coder"
  "minimax-general|$HOME/.minimax/agents/general/skills|MiniMax agent: general"
  "minimax-verifier|$HOME/.minimax/agents/verifier/skills|MiniMax agent: verifier"
)

name_filter=""
json_only=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)  name_filter="$2"; shift 2 ;;
    --human) json_only=false; shift ;;
    -h|--help)
      cat <<EOF
Usage: detect.sh [--name <harness-name>] [--human]

Options:
  --name <name>   Only show one harness (e.g. claude-code, codex)
  --human         Output a human-readable table instead of JSON
  -h, --help      Show this help

Output: JSON or human-readable table to stdout.
Exit codes: 0 success, 1 error.
EOF
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Build the JSON output.
result="["
first=1
for entry in "${KNOWN_HARNESSES[@]}"; do
  IFS='|' read -r hname hpath hnote <<< "$entry"
  if [[ -n "$name_filter" && "$name_filter" != "$hname" ]]; then
    continue
  fi
  # Order matters: check for symlink FIRST because [[ -d ]] follows symlinks
  # and would otherwise label a pooled symlink as "real-dir" (not-pooled).
  if [[ -L "$hpath" ]]; then
    # Resolve the symlink target; report pooled if it points to canonical.
    target=$(readlink "$hpath")
    if [[ -d "$target" ]]; then
      state="pooled"
      item_count=$(ls -A "$hpath" 2>/dev/null | wc -l | tr -d ' ')
    else
      state="broken-symlink"
      item_count=0
    fi
  elif [[ -d "$hpath" ]]; then
    # Real directory (not a symlink). Not yet pooled into the unified pool.
    state="real-dir"
    item_count=$(ls -A "$hpath" 2>/dev/null | wc -l | tr -d ' ')
  else
    state="absent"
    item_count=0
  fi
  if [[ $first -eq 0 ]]; then
    result+=","
  fi
  first=0
  result+=$(printf '{"name":"%s","path":"%s","state":"%s","item_count":%s,"notes":"%s"}' \
    "$hname" "$hpath" "$state" "$item_count" "$hnote")
done
result+="]"

if [[ "$json_only" == "false" ]]; then
  export DETECT_JSON="$result"
  python3 <<'PYEOF'
import json, os
data = json.loads(os.environ["DETECT_JSON"])
print("{:<18} {:<16} {:>6}  PATH".format("HARNESS", "STATE", "ITEMS"))
print("-" * 80)
for h in data:
    print("{:<18} {:<16} {:>6}  {}  ({})".format(
        h["name"], h["state"], h["item_count"], h["path"], h["notes"]))
print()
pooled = sum(1 for h in data if h["state"] == "pooled")
real_dir = sum(1 for h in data if h["state"] == "real-dir")
absent = sum(1 for h in data if h["state"] == "absent")
broken = sum(1 for h in data if h["state"] == "broken-symlink")
print("Total: {} known. Pooled: {}. Real-dirs (unpooled): {}. Absent: {}. Broken: {}.".format(
    len(data), pooled, real_dir, absent, broken))
PYEOF
else
  echo "$result"
fi
