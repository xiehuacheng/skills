#!/usr/bin/env bash
# symlink.sh - Replace each harness's skills dir with a symlink to canonical.
# Usage:
#   symlink.sh <harness-list-json> <canonical-dir>   # Symlink all
#   symlink.sh <harness-name> <harness-path> <canonical-dir>  # Symlink one
# Output: JSON per-harness result to stdout.

set -euo pipefail

CANONICAL=""
mode="all"
HARNESS_JSON=""
ONE_NAME=""
ONE_PATH=""

if [[ $# -eq 2 ]]; then
  HARNESS_JSON="$1"
  CANONICAL="$2"
elif [[ $# -eq 3 ]]; then
  ONE_NAME="$1"
  ONE_PATH="$2"
  CANONICAL="$3"
  mode="one"
else
  echo "Usage:
  symlink.sh <harness-list-json> <canonical-dir>
  symlink.sh <harness-name> <harness-path> <canonical-dir>" >&2
  exit 1
fi

[[ -d "$CANONICAL" ]] || { echo "[ERROR] canonical does not exist: $CANONICAL" >&2; exit 1; }
command -v mavis-trash >/dev/null 2>&1 || { echo "[ERROR] mavis-trash not found" >&2; exit 1; }

results="["
first=1

symlink_one() {
  local name="$1" target_dir="$2"
  local status="ok" message=""

  # Ensure parent exists
  mkdir -p "$(dirname "$target_dir")"

  if [[ -L "$target_dir" ]]; then
    local existing=$(readlink "$target_dir")
    if [[ "$existing" == "$CANONICAL" ]]; then
      status="already"
      message="symlink already points to canonical"
    else
      mavis-trash "$target_dir" >/dev/null 2>&1 || true
      ln -s "$CANONICAL" "$target_dir"
      status="replaced"
      message="replaced wrong-target symlink"
    fi
  elif [[ -d "$target_dir" ]]; then
    if [[ -z "$(ls -A "$target_dir" 2>/dev/null)" ]]; then
      mavis-trash "$target_dir" >/dev/null 2>&1 || true
      ln -s "$CANONICAL" "$target_dir"
      status="created"
      message="empty dir replaced with symlink"
    else
      status="skipped"
      message="dir not empty, refused to overwrite"
    fi
  else
    ln -s "$CANONICAL" "$target_dir"
    status="created"
    message="new symlink created"
  fi

  printf '{"name":"%s","path":"%s","status":"%s","message":"%s"}' \
    "$name" "$target_dir" "$status" "$message"
}

if [[ "$mode" == "all" ]]; then
  while IFS= read -r hjson; do
    hname=$(echo "$hjson" | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')
    hpath=$(echo "$hjson" | python3 -c 'import json,sys; print(json.load(sys.stdin)["path"])')
    [[ -e "$hpath" || -L "$hpath" ]] || { continue; }  # skip absent
    [[ $first -eq 0 ]] && results+=","
    first=0
    results+="$(symlink_one "$hname" "$hpath")"
  done < <(echo "$HARNESS_JSON" | python3 -c 'import json,sys; [print(json.dumps(h)) for h in json.load(sys.stdin)]')
else
  results+="$(symlink_one "$ONE_NAME" "$ONE_PATH")"
fi
results+="]"

echo "$results"
