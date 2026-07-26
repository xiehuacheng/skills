# Conflict Resolution

When the same skill name exists in more than one harness's user-skill directory, the pool setup encounters a conflict. This document spells out the policy in full.

## Policy: canonical version wins

1. If the canonical location (`~/.agents/skills/<name>/`) already has a version of the skill, **that version is kept**. The conflicting version from each harness is preserved in a separate tree, not deleted.
2. If the canonical location does **not** have the skill, the first harness encountered (in the order kimi-code, claude-code, codex) provides the canonical version. Other versions go to the conflict-versions tree.
3. If the canonical version is empty or broken (zero files, missing `SKILL.md`, unreadable), the conflict-versions version is promoted to canonical and the swap is recorded in the merge report.

## Where conflicts are stored

`~/.skills-conflict-versions-<ts>/<harness-name>/<skill-name>/`

- The `<ts>` is the same timestamp as the backup tarball.
- The tree is created by `scripts/merge.sh` and survives across all later flows.
- It is **not** auto-cleaned. The user reviews and trims it manually.

## How the user reviews

For each conflict:

1. Open `~/.skills-conflict-versions-<ts>/<harness>/<skill>/SKILL.md` (or other files) in their preferred editor.
2. Diff against the canonical version: `diff -r ~/.agents/skills/<skill> ~/.skills-conflict-versions-<ts>/<harness>/<skill>/`.
3. If the conflict-versions version is better, replace canonical: `cp -R ~/.skills-conflict-versions-<ts>/<harness>/<skill>/* ~/.agents/skills/<skill>/`.
4. If canonical is fine, delete the conflict-versions copy: `mavis-trash ~/.skills-conflict-versions-<ts>/<harness>/<skill>`.

The full conflict-versions tree can be cleared once the user has reviewed everything: `mavis-trash ~/.skills-conflict-versions-<ts>`.

## Common conflict shapes

### Symlinks already pointing to canonical

Some harnesses may already have symlinks to canonical (e.g. from a prior partial setup). These are detected by `merge.sh` as regular files (not directories) and silently skipped. The verify step will report them as `ok` since the symlink target is canonical.

### Hidden directories

Harnesses may have hidden directories (`.system`, `.DS_Store`, etc.) that are not skills. These are moved to the trash by `merge.sh` and do not enter canonical or the conflict-versions tree.

### Empty directories

`merge.sh` deletes empty skill directories during migration. They are not considered conflicts.

### Identical content

If two harnesses have the same skill name with byte-identical content, the second is moved to the conflict-versions tree (because the policy treats "name already in canonical" as a conflict, even if content matches). The user can simply delete the conflict-versions copy without diffing.

### Different content, same name

The common case. Diff and replace as needed. If the user wants to merge both versions into one canonical, that is a manual edit, not a scriptable flow.

## Why not "merge" conflicts?

Automatic merging of skill files is risky:

- Two harnesses may have intentionally evolved the same skill in different directions (e.g. claude's `subagent-driven-development` may have different subagent prompts than codex's version).
- Skill content is mostly prose + a few scripts; auto-merge produces unreadable results.
- The user always has the conflict-versions tree to recover from.

Hence the rule: never auto-merge, always preserve both, let the user choose.

## Backup interaction

`merge.sh` creates the tarball backup **before** touching any file system. The conflict-versions tree is **not** in the tarball; it is a separate recovery path. The tarball contains the original harness directories as they were before the migration.
