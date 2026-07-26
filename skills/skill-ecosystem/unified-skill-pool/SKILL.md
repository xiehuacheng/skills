---
name: unified-skill-pool
description: Unify Agent Skills directories across multiple coding-agent harnesses (Claude Code, Codex, Kimi Code, OpenCode, oh-my-pi, MiniMax, Cursor, Windsurf, Antigravity) into one canonical pool via symlinks. Use when the user wants to set up a shared skills directory, sync skills between harnesses, add a new harness to an existing pool, install a new skill to every visible harness at once, audit symlink health, or merge duplicate skill folders. Triggers on phrases like "unify my skills", "sync skills across agents", "make [harness] see my skills", "skills disappeared from [harness]", "duplicate skills across harnesses", "merge skill directories", "add a new agent", "install skill to all harnesses", "verify skill symlinks".
metadata:
  author: Mavis
  version: "0.3.0"
  generated-by: creating-skills
---

# Unified Skill Pool

Maintain one canonical Agent Skills directory that every coding-agent harness on the machine reads from. Replace each harness's per-user skills directory with a symlink to the canonical pool, so adding or updating a skill in one place propagates to every harness automatically.

## When to use

Trigger this skill when the user wants any of:

- **Set up a shared skills directory** for the first time across two or more harnesses
- **Sync** skills between harnesses that have drifted out of alignment
- **Add a new harness** to an existing pool (e.g. just installed Cursor, wants it to see the existing skills)
- **Install a new skill** so every visible harness sees it
- **Audit symlink health** when a harness reports a missing or stale skill
- **Merge duplicate skill folders** accumulated across harnesses

The skill targets **user-level** skills (cross-project). Per-project skills (e.g. `./.claude/skills/`) are out of scope.

## When NOT to use

- Only one coding-agent harness is installed - put skills directly in its user dir, no pool needed
- User wants per-project skill isolation - that is the harness's own concern
- User wants to translate a skill between languages or formats - use `skill-translator`
- User wants a published / versioned skill registry - that is `hot-skills` plus a publishing flow, not this skill
- Cross-platform (Linux/Windows) - this skill is macOS-tested only; other platforms will likely fail at filesystem-level steps. Decline and document, do not improvise

## Boundaries

### Can do

- Detect which coding-agent harnesses are installed on the user's machine
- Pick a canonical location (default `~/.agents/skills/`)
- Back up every harness's existing skills directory to a single timestamped tarball
- Move skills from each harness into the canonical pool, with conflict resolution (canonical-version-wins; conflicts preserved in a separate `~/.skills-conflict-versions-<ts>/` tree)
- Replace each harness's user-skills directory with a symlink to canonical
- Verify that every symlink resolves and every harness sees the full pool
- Install a new skill (local path) into the canonical pool, instantly visible to every harness
- Add a new harness to the pool interactively (detect path, confirm, symlink)
- Provide a non-destructive health check that reports broken or missing symlinks

### Cannot do without explicit approval

- Touch files outside the user-skills directories of the affected harnesses
- Modify harness configuration files (`settings.json`, `config.toml`, etc.)
- Delete a user's existing skill without first backing it up to the conflict-versions tree
- Change the canonical location once it has been set, without confirming the move
- Operate on `.builtin-skills/` system directories of any harness (these are read-only by design)

### Default behavior

- **Read-only by default.** Any destructive action (move, symlink replace, conflict resolution) requires an explicit confirmation step shown in chat before it runs.
- **Back up first.** Every setup or migration flow creates a single tarball backup at `~/skills-backup-<ts>.tar.gz` before any modification.
- **Symlink, do not copy.** The default is `ln -s`. Copying is available on request but discouraged because it breaks the "update once, propagate everywhere" property.
- **Conflict policy: canonical version wins.** When the same skill name exists in multiple harness dirs, the version already in canonical is kept. Other versions are moved to `~/.skills-conflict-versions-<ts>/<harness>/<skill>/` for user-driven review.
- **macOS only.** `~/` and `mavis-trash` are macOS conventions. The skill explicitly fails fast if it cannot find `mavis-trash` in `PATH`.

## Pre-run checks

Before running any setup or migration, confirm:

1. The user has at least two coding-agent harnesses installed (otherwise decline - see "When NOT to use").
2. The canonical location is writable. Default `~/.agents/skills/`.
3. `mavis-trash` is available on `PATH` (`which mavis-trash`).
4. The user has read permission on every harness's existing skills directory.
5. The user has explicitly approved the destructive flow (move + symlink). The skill never auto-runs migration. **Additionally**, the destructive `merge.sh` script defaults to dry-run mode; the agent must pass `--apply` after showing the user the dry-run report.

## Core workflow

The skill has three flows, all built on the same script set. Use the flow that matches the user's request; do not run all three when one suffices.

### Flow 1 - Initial setup (one-time)

1. Run `scripts/detect.sh` to enumerate installed harnesses and their skill paths.
2. Confirm the canonical location with the user (default `~/.agents/skills/`).
3. Show the user the detected harness list and ask: "These are the harnesses I will pool together - proceed?"
4. Run `scripts/merge.sh <harness-list-json> <canonical>` in **dry-run** mode (the default — no `--apply` flag):
   - Reads harness list and computes what would move / conflict / be trashed.
   - Creates no backup, performs no actions.
   - Outputs a JSON report with `dry_run: true` showing the planned actions.
5. Show the user the dry-run report. Ask: "This is what would happen. Proceed? I will then re-run with `--apply` to execute."
6. After user confirmation, re-run `scripts/merge.sh <harness-list-json> <canonical> --apply`:
   - Create backup tarball at `~/skills-backup-<ts>.tar.gz` first.
   - Move each skill from each harness into canonical, applying conflict policy.
   - Move harness-side leftovers (`.DS_Store`, hidden dirs, etc.) to the trash via `mavis-trash`.
   - Output JSON report to stdout: `{"dry_run": false, "moved": [...], "skipped": [...], "conflicts": [...], "backup_path": "..."}`.
7. Show the user the apply report. Ask: "Conflicts were preserved in `~/.skills-conflict-versions-<ts>/`. Proceed to symlinking?"
8. Run `scripts/symlink.sh <harness-list-json> <canonical>` to replace each harness's skills dir with a symlink.
9. Run `scripts/verify.sh` to confirm every harness sees the full pool.
10. Hand the user the management entrypoint at `~/.agents/skills/skills-sync.sh` for future maintenance.

### Flow 2 - Maintenance

- **Add a skill to every harness:** `scripts/install-skill.sh <path-to-skill-dir>`. The script copies the skill into canonical and re-verifies visibility.
- **Audit symlink health:** `scripts/verify.sh`. Reports broken symlinks, missing canonical, missing harness dirs. The skill never auto-fixes; it always shows the report and asks. Accepts `--canonical <dir>` and `--harness name:path` (repeatable) for ad-hoc entries not in the table.
- **Recover a deleted or replaced symlink:** `scripts/symlink.sh <harness-list-json> <canonical>`. One-harness recovery from a drift.

### Flow 3 - Add a new harness

1. Ask the user which harness they just installed.
2. Look up the expected path in `references/harness-paths.md`. Three cases:
   - **Harness in the table, path matches the user's report:** proceed to step 3.
   - **Harness in the table, path differs (e.g. user has a custom install location):** confirm with the user, then proceed. Optionally offer to update the table for future runs.
   - **Harness not in the table:** ask the user for the path, then offer to extend the table.
3. Confirm: "Add `<harness>` at `<path>` to the pool? It will become a symlink to `<canonical>`."
4. If the target path is an existing non-empty directory, surface that fact and ask the user how to proceed (overwrite, merge first, abort). Do not silently clobber.
5. Run `scripts/add-harness.sh <harness-name> <path> <canonical>`.
6. Run `scripts/verify.sh` and show the result.

## Conversational patterns

- **Propose, then pause.** Every destructive action gets a confirmation in chat before the script runs.
- **Show the report.** After any flow, show the user the JSON or human-readable summary, do not assume success.
- **Ask one question at a time.** If the user is silent for a confirmation, do not chain the next step.
- **Be explicit about the conflict policy.** When conflicts are found, the user must understand that the canonical version was kept and their other versions are recoverable from the conflict-versions tree.

## Expected outputs

- **detect.sh:** JSON list of harnesses with their skill dir paths and current item counts.
- **merge.sh:** JSON report with `dry_run` boolean; when `true`, lists `would_move` / `would_conflict` / `would_backup_paths` and performs no actions. When `false` (via `--apply`), lists actual `moved` / `conflicts` plus `backup_path`. Also updates `.manifest.json` in canonical for each moved skill.
- **symlink.sh:** Per-harness pass/fail with the symlink target.
- **verify.sh:** Human-readable table of every harness plus symlink health. Also refreshes `current_harnesses` for every manifest entry, and reports drift (skills in pool without a manifest entry, or manifest entries without a matching skill in the pool).
- **install-skill.sh:** Confirmation of the new skill's path in canonical and that every harness can list it. Accepts `--upstream <owner/repo>` to record the external source repo. Updates `.manifest.json`.
- **add-harness.sh:** Confirmation of the new symlink and the verified harness count.

## Provenance tracking (`.manifest.json`)

`~/.agents/skills/.manifest.json` records where each skill came from. Layout:

```json
{
  "version": 1,
  "generated_at": "2026-07-26T12:11:08Z",
  "skills": {
    "brainstorming": {
      "name": "brainstorming",
      "first_seen_harness": "kimi-code",
      "first_seen_at": "2026-07-11T14:47:00Z",
      "upstream": null,
      "current_harnesses": ["claude-code", "codex", "kimi-code", ...]
    }
  }
}
```

- `first_seen_harness` is set by `merge.sh` from the harness that originally moved the skill into canonical.
- `first_seen_at` is set at the same moment and never overwritten.
- `upstream` is set by `install-skill.sh --upstream <owner/repo>` (e.g. `obra/superpowers`, `anthropics/skills`). `merge.sh` does not know the upstream repo, so it leaves this `null`.
- `current_harnesses` is recomputed by `verify.sh` from the live symlink state on every run.

`verify.sh` reports drift: skills in the pool with no manifest entry, and manifest entries with no matching skill. Both are warnings, not errors, but the user should reconcile them. The file is auto-managed by the scripts — do not edit by hand unless you are bootstrapping a new pool.

## Error handling

- Missing `mavis-trash` - fail fast with explicit installation instructions.
- Harness dir not writable - fail fast on that harness, do not modify others, report which were processed.
- Backup tarball creation fails - abort the entire flow, do not proceed.
- Conflict with the canonical name but the canonical version is empty or broken - preserve the conflict-versions version, move it into canonical, mark the swap in the report.
- User wants to cancel mid-flow - restore from the backup tarball the user just created. Never delete the backup until the user explicitly confirms the new layout.

## References

- `references/harness-paths.md` - table of known harness user-skill directories
- `references/conflict-resolution.md` - full conflict-handling policy and edge cases
- `references/troubleshooting.md` - common failures and recovery steps
