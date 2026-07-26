# Troubleshooting

Common failures and how to recover.

## "mavis-trash not found in PATH"

`mavis-trash` is the macOS-native recoverable removal tool used by this skill. It is part of the MiniMax runtime. If you see this error:

1. Confirm it is installed: `which mavis-trash`.
2. If missing, the MiniMax runtime is not installed. Install MiniMax Code or point the skill at `rm -rf` (NOT recommended; you lose recoverability).
3. Re-run the script after fixing the PATH.

## "harness dir not writable" / "Permission denied"

A harness's user-skill directory exists but the user lacks write permission. Causes:

- The directory was created by a different user (e.g. via `sudo` or a different harness install).
- The directory is on a read-only mount.

Fix: `chown -R $(whoami) <harness-dir>` and re-run. The skill reports which harnesses were processed before the failure, so partial progress is preserved.

## "Backup tarball creation failed"

`merge.sh` aborts the entire flow if the backup tarball cannot be created. Causes:

- Disk full.
- `~/` is on a read-only volume.

Fix: free up space or relocate the canonical to a writable volume. The original harness directories are still untouched at this point, so a failed setup is a no-op.

## "broken-link" in verify.sh output

A symlink exists in a harness dir but its target is missing or not a directory. Causes:

- The canonical directory was deleted or moved.
- The symlink was created with a wrong target (typo).

Fix:

```bash
# Recreate the symlink (use the harness's path from verify.sh output)
mavis-trash <harness-dir>   # only if it is the broken symlink
ln -s <canonical-dir> <harness-dir>
```

Or run `symlink.sh <harness-list-json> <canonical>` to re-link every harness at once.

## "not-pooled" in verify.sh output

A real directory exists where a symlink was expected. This means a harness was installed or its directory was recreated after the initial pool setup. Causes:

- The harness auto-created its skills directory on first run.
- The user manually created a directory for a new harness.

Fix: `scripts/add-harness.sh <harness-name> <harness-path> <canonical>` to convert the real directory to a symlink. The skill will warn if the directory is non-empty (refusing to overwrite without explicit approval).

## "absent" in verify.sh output

The harness's skills directory does not exist. This is normal for harnesses the user has not installed yet. No action required. If the user just installed a new harness, the path may differ from the table; check `references/harness-paths.md` and update if needed.

## "duplicate skills across harnesses" trigger phrase

The user has noticed the same skill in two harness dirs. Run `merge.sh` to consolidate. Conflicts will be recorded in the report and the conflict-versions tree.

## "skills disappeared from [harness]"

Verify output shows a previously-working harness as `absent` or `broken-link`. Two likely causes:

- The harness was uninstalled and reinstalled with a fresh user dir. Run `add-harness.sh` to re-link.
- The symlink was deleted by a harness update. Run `symlink.sh` to re-link.

## "verify says canonical MISSING"

The canonical directory was deleted. Restore from the most recent backup:

```bash
# Find the latest backup
ls -t ~/skills-backup-*.tar.gz | head -1
# Restore
mkdir -p ~/.agents
tar -xzf <latest-backup> -C /tmp
# Manually copy skills back
cp -R /tmp/.claude/skills/* ~/.agents/skills/  # or whichever harness was canonical at the time
```

The tarball preserves the harness's directory layout, so you may need to extract the `.claude/skills/` (or similar) subdirectory specifically.

## Backups piling up

`merge.sh` creates one tarball per setup flow. If the user has run setup multiple times, `~/skills-backup-*.tar.gz` will accumulate. The skill does not auto-delete them. The user can review and trim:

```bash
ls -lh ~/skills-backup-*.tar.gz
# Once confirmed no longer needed:
mavis-trash ~/skills-backup-<old-timestamp>.tar.gz
```

Recommended: keep the most recent backup plus any tarball that corresponds to an unmerged conflict-versions tree.

## Symlink loop

If `verify.sh` reports a symlink whose target is itself or a parent, this is a misconfiguration. Causes: the user ran `ln -s <harness-dir> <harness-dir>` or specified the wrong target.

Fix: delete the bad symlink with `mavis-trash` and re-run `symlink.sh` with the correct arguments.

## When in doubt

- The full backup is in `~/skills-backup-<ts>.tar.gz`.
- The full conflict-versions tree is in `~/.skills-conflict-versions-<ts>/`.
- You can always restore by extracting the tarball and re-running `merge.sh` with the original canonical.
